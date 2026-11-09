import { headers } from "next/headers";
import NextAuth from "next-auth";
import { getToken, type JWT } from "next-auth/jwt";
import Keycloak from "next-auth/providers/keycloak";
import { transaction } from "@/lib/db";
import { ROLES, type Role } from "@/lib/types";

declare module "next-auth" {
  interface Session {
    /** The Keycloak ID token, kept so sign-out can end the Keycloak session too. */
    idToken?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId?: string;
    idToken?: string;
    accessToken?: string;
    refreshToken?: string;
    /** Seconds since epoch. */
    expiresAt?: number;
    error?: "RefreshFailed";
  }
}

type KeycloakProfile = {
  sub: string;
  name?: string;
  preferred_username?: string;
  email?: string;
};

/** Realm roles live in the access token, not the ID token, unless a mapper adds them. */
function realmRoles(accessToken: string | undefined): string[] {
  if (!accessToken) return [];
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8"));
    return payload?.realm_access?.roles ?? [];
  } catch {
    return [];
  }
}

/** Accepts `HR_ADMIN`, `hr-admin`, `hr admin` and so on. The strongest role wins. */
function roleFrom(roles: string[]): Role {
  const normalized = new Set(roles.map((role) => role.toUpperCase().replace(/[\s-]/g, "_")));
  return [...ROLES].reverse().find((role) => normalized.has(role)) ?? "EMPLOYEE";
}

/** Creates the register's own record for a Keycloak user, or refreshes their name and role. */
function upsertUser(profile: KeycloakProfile, role: Role): string {
  const id = `kc-${profile.sub}`;
  const name = profile.name || profile.preferred_username || profile.email || "Unnamed user";
  transaction((db) => {
    const existing = db.users.find((user) => user.id === id);
    if (existing) {
      existing.name = name;
      existing.role = role;
    } else {
      db.users.push({ id, name, title: profile.email ?? "", role });
    }
  });
  return id;
}

/** Builds the realm issuer, e.g. https://alpha-idp.oss.net.bd/realms/Leave-MGMT-Test. */
export function keycloakIssuer() {
  const url = (process.env.KEYCLOAK_URL ?? "").replace(/\/+$/, "");
  const realm = encodeURIComponent(process.env.KEYCLOAK_REALM ?? "");
  return `${url}/realms/${realm}`;
}

/** Keycloak access tokens are short-lived (5 minutes by default), so swap the refresh token for a new one. */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) return { ...token, error: "RefreshFailed" };
  try {
    const response = await fetch(`${keycloakIssuer()}/protocol/openid-connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.AUTH_KEYCLOAK_ID ?? "",
        refresh_token: token.refreshToken,
      }),
    });
    const tokens = await response.json();
    if (!response.ok) throw new Error(tokens.error_description ?? tokens.error);
    return {
      ...token,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? token.refreshToken,
      idToken: tokens.id_token ?? token.idToken,
      expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
      error: undefined,
    };
  } catch {
    return { ...token, error: "RefreshFailed" };
  }
}

/**
 * The Keycloak access token for the signed-in user, refreshed if needed.
 * Server-only: it is read from the encrypted session cookie and never sent to the browser.
 */
export async function getAccessToken(): Promise<string | null> {
  const requestHeaders = await headers();
  const token = await getToken({
    req: { headers: requestHeaders },
    secret: process.env.AUTH_SECRET,
    // Auth.js prefixes the cookie with __Secure- only when served over https.
    secureCookie: (requestHeaders.get("cookie") ?? "").includes("__Secure-authjs.session-token"),
  });
  if (!token?.accessToken) return null;
  if (token.expiresAt && Date.now() / 1000 < token.expiresAt - 30) return token.accessToken;
  const refreshed = await refreshAccessToken(token);
  return refreshed.error ? null : (refreshed.accessToken ?? null);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      issuer: keycloakIssuer(),
      // leave-mgmt-public is a public client: no secret, PKCE protects the code exchange.
      clientSecret: undefined,
      client: { token_endpoint_auth_method: "none" },
      checks: ["pkce", "state"],
    }),
  ],
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.userId = upsertUser(profile as KeycloakProfile, roleFrom(realmRoles(account.access_token)));
        token.idToken = account.id_token;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }
      if (!token.expiresAt || Date.now() / 1000 < token.expiresAt - 30) return token;
      return refreshAccessToken(token);
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      session.idToken = token.idToken;
      return session;
    },
  },
});
