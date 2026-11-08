import { LEAVE_TYPES, type Balance, type Database, type LeaveType, type User } from "./types";

const USERS: User[] = [
  { id: "u-farhana", name: "Farhana Akter", title: "Program Officer", role: "EMPLOYEE", supervisorId: "u-nasrin" },
  { id: "u-tanvir", name: "Tanvir Hasan", title: "Accounts Officer", role: "EMPLOYEE", supervisorId: "u-nasrin" },
  { id: "u-imran", name: "Imran Chowdhury", title: "Systems Analyst", role: "EMPLOYEE", supervisorId: "u-kamal" },
  { id: "u-nusrat", name: "Nusrat Jahan", title: "Research Officer", role: "EMPLOYEE", supervisorId: "u-kamal" },
  { id: "u-nasrin", name: "Nasrin Sultana", title: "Deputy Director, Programs", role: "SUPERVISOR" },
  { id: "u-kamal", name: "Kamal Uddin", title: "Deputy Director, Systems", role: "SUPERVISOR" },
  { id: "u-shirin", name: "Shirin Ahmed", title: "HR Manager", role: "HR_ADMIN" },
];

const ENTITLEMENT: Record<LeaveType, number> = { ANNUAL: 20, SICK: 14, CASUAL: 10 };

export function createSeed(): Database {
  const balances: Balance[] = USERS.filter((user) => user.role === "EMPLOYEE").flatMap((user) =>
    LEAVE_TYPES.map((type) => ({ userId: user.id, type, entitled: ENTITLEMENT[type], used: 0 })),
  );
  return { users: USERS, balances, applications: [] };
}
