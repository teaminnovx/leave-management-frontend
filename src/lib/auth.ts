import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { read } from "./db";
import type { Role, User } from "./types";

/** The register's record for whoever is signed in through Keycloak. */
export async function currentUser(): Promise<User | null> {
  const userId = (await auth())?.user?.id;
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
