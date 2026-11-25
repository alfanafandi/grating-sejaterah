import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one } from "./db.mjs";

export const sessionCookie = "grating_admin";
export const tokenHash = (token) => createHash("sha256").update(token).digest("hex");

export async function activeAdmin() {
  const token = (await cookies()).get(sessionCookie)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return one(
    "SELECT u.id, u.name FROM admin_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > UTC_TIMESTAMP()",
    [tokenHash(token)],
  );
}

export async function requireAdmin() {
  const user = await activeAdmin();
  if (!user) redirect("/admin/login");
  return user;
}
