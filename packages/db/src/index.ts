import { env } from "@RealEstateProject/env/server";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../prisma/generated/client";
import pg, { type PoolClient } from "pg";
import { useCaseSql } from "./usecase-query-catalog";

export function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export { useCaseSql };
export type UseCaseQueryId = keyof typeof useCaseSql;

/** Execute fixed catalogue SQL with values supplied separately as bind parameters. */
export async function runUseCaseQuery<T = Record<string, unknown>>(
  queryId: UseCaseQueryId,
  values: readonly unknown[] = [],
): Promise<T[]> {
  return prisma.$queryRawUnsafe<T[]>(useCaseSql[queryId], ...values);
}

/** Keep all statements, including advisory locks, on one PostgreSQL connection. */
export function withUseCaseTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction((tx) => callback(tx as PrismaClient));
}

export async function runUseCaseQueryIn<T = Record<string, unknown>>(
  tx: PrismaClient,
  queryId: UseCaseQueryId,
  values: readonly unknown[] = [],
): Promise<T[]> {
  return tx.$queryRawUnsafe<T[]>(useCaseSql[queryId], ...values);
}

const prisma = createPrismaClient();
export default prisma;

const useCasePool = new pg.Pool({ connectionString: env.DATABASE_URL });

/** PostgreSQL driver's row decoder supports Q5.7's unchanged `void` result. */
export async function runPostgresUseCaseQueryIn<T = Record<string, unknown>>(
  client: PoolClient,
  queryId: UseCaseQueryId,
  values: readonly unknown[] = [],
): Promise<T[]> {
  const result = await client.query(useCaseSql[queryId], [...values]);
  return result.rows as T[];
}

/** UC5 keeps its advisory lock, overlap check, and write on one connection. */
export async function withPostgresUseCaseTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await useCasePool.connect();
  let commitSent = false;
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    commitSent = true;
    await client.query("COMMIT");
    return result;
  } catch (error) {
    if (!commitSent) {
      try { await client.query("ROLLBACK"); } catch { /* The connection may have been lost. */ }
    }
    throw error;
  } finally {
    client.release();
  }
}
