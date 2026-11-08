"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./auth";
import { read } from "./db";

export async function signIn(formData: FormData) {
  const userId = String(formData.get("userId") ?? "");
  const exists = read((db) => db.users.some((user) => user.id === userId));
  if (!exists) redirect("/login");

  (await cookies()).set(SESSION_COOKIE, userId, { httpOnly: true, sameSite: "lax", path: "/" });
  redirect("/");
}

export async function signOut() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/login");
}
