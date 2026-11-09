import NextAuth from "next-auth";
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

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
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
    jwt({ token, account, profile }) {
      if (account && profile) {
        token.userId = upsertUser(profile as KeycloakProfile, roleFrom(realmRoles(account.access_token)));
        token.idToken = account.id_token;
      }
      return token;
    },
    session({ session, token }) {
      if (token.userId) session.user.id = token.userId;
      session.idToken = token.idToken;
      return session;
    },
  },
});
