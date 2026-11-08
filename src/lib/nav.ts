import type { Role } from "./types";

export type NavItem = { href: string; label: string };

export const NAV: Record<Role, NavItem[]> = {
  EMPLOYEE: [],
  SUPERVISOR: [],
  HR_ADMIN: [],
};
