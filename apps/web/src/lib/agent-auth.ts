import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import prisma from "@RealEstateProject/db";

const scrypt = promisify(nodeScrypt);
const SESSION_COOKIE = "agent_session";
const SESSION_DAYS = 14;

type AgentIdentity = { id: string; username: string };

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, storedHex] = encoded.split("$");
  if (algorithm !== "scrypt" || !salt || !storedHex || !/^[a-f0-9]{128}$/i.test(storedHex)) return false;
  const actual = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(storedHex, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function createAgentSession(agentId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.agentSession.create({ data: { agentId, tokenHash: hashSessionToken(token), expiresAt } });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getAgent(): Promise<AgentIdentity | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.agentSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    select: { expiresAt: true, agent: { select: { id: true, username: true } } },
  });
  if (!session) return null;
  if (session.expiresAt <= new Date()) {
    await prisma.agentSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
    return null;
  }
  return session.agent;
}

export async function requireAgent(): Promise<AgentIdentity> {
  const agent = await getAgent();
  if (!agent) redirect("/login");
  return agent;
}

export async function destroyAgentSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await prisma.agentSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
  jar.delete(SESSION_COOKIE);
}
