"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, signIn, signOut } from "@/auth";

/** Only same-site paths, so the login page cannot be used as an open redirect. */
function safePath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/";
}

export async function signInWithKeycloak(formData: FormData) {
  await signIn("keycloak", { redirectTo: safePath(formData.get("callbackUrl")) });
}

/** Clears the app session, then ends the Keycloak session so the next sign-in asks again. */
export async function signOutEverywhere() {
  const idToken = (await auth())?.idToken;
  await signOut({ redirect: false });

  const host = (await headers()).get("host");
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const logout = new URL(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/logout`);
  logout.searchParams.set("client_id", process.env.AUTH_KEYCLOAK_ID ?? "");
  logout.searchParams.set("post_logout_redirect_uri", `${protocol}://${host}/login`);
  if (idToken) logout.searchParams.set("id_token_hint", idToken);
  redirect(logout.toString());
}
