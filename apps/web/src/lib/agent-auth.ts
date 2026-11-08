import { createHmac, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@RealEstateProject/env/server";

const scrypt = promisify(nodeScrypt);
const SESSION_COOKIE = "agent_session";
const SESSION_SECONDS = 14 * 24 * 60 * 60;
type AgentIdentity = { userId: string; username: string };

function sign(payload: string) {
  return createHmac("sha256", env.BETTER_AUTH_SECRET).update(payload).digest("base64url");
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

export async function createAgentSession(userId: string, username: string) {
  const payload = Buffer.from(JSON.stringify({ userId, username, expires: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  const jar = await cookies();
  jar.set(SESSION_COOKIE, `${payload}.${sign(payload)}`, { httpOnly:true, secure:process.env.NODE_ENV === "production", sameSite:"lax", path:"/", maxAge:SESSION_SECONDS });
}

export async function getAgent(): Promise<AgentIdentity | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload,"base64url").toString("utf8"));
    if (typeof data.userId !== "string" || !/^\d+$/.test(data.userId) || typeof data.username !== "string" || data.expires <= Date.now()/1000) return null;
    return { userId:data.userId, username:data.username };
  } catch { return null; }
}

export async function requireAgent(): Promise<AgentIdentity> {
  const agent = await getAgent();
  if (!agent) redirect("/login");
  return agent;
}

export async function destroyAgentSession() {
  (await cookies()).delete(SESSION_COOKIE);
}
