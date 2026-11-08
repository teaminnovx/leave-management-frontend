import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { read } from "./db";
import type { Role, User } from "./types";

/**
 * Stand-in for Keycloak: the cookie names the signed-in demo user.
 * There is no password, so this must not be deployed as real authentication.
 */
export const SESSION_COOKIE = "lms_user";

export async function currentUser(): Promise<User | null> {
  const userId = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!userId) return null;
  return read((db) => db.users.find((user) => user.id === userId) ?? null);
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
