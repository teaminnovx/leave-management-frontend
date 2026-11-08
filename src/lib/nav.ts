import type { Role } from "./types";

export type NavItem = { href: string; label: string };

export const NAV: Record<Role, NavItem[]> = {
  EMPLOYEE: [
    { href: "/applications", label: "My applications" },
    { href: "/applications/new", label: "Apply for leave" },
  ],
  SUPERVISOR: [{ href: "/review", label: "Review queue" }],
  HR_ADMIN: [],
};
