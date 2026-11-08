import type { Role } from "./types";

export type NavItem = { href: string; label: string };

export const HOME: Record<Role, string> = {
  EMPLOYEE: "/applications",
  SUPERVISOR: "/review",
  HR_ADMIN: "/hr",
};

export const NAV: Record<Role, NavItem[]> = {
  EMPLOYEE: [
    { href: "/applications", label: "My applications" },
    { href: "/applications/new", label: "Apply for leave" },
  ],
  SUPERVISOR: [{ href: "/review", label: "Review queue" }],
  HR_ADMIN: [
    { href: "/hr", label: "Overview" },
    { href: "/hr/balances", label: "Leave balances" },
    { href: "/hr/archive", label: "Leave archive" },
  ],
};
