import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Optimistic check only: sends signed-out visitors to the login page before rendering.
 * Pages still call requireUser()/requireRole(), which is the real authorization.
 */
export const proxy = auth((request) => {
  if (request.auth?.user) return;

  const login = new URL("/login", request.nextUrl.origin);
  login.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
});

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
};
