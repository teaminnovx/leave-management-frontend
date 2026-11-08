import { requireRole } from "@/lib/auth";
import { availableDays } from "@/lib/balances";
import { today } from "@/lib/dates";
import { read } from "@/lib/db";
import { LEAVE_TYPES, type LeaveType } from "@/lib/types";
import { LeaveForm } from "@/modules/leave-request/leave-form";

export default async function NewApplicationPage() {
  const user = await requireRole("EMPLOYEE");
  const { available, lastSaved } = read((db) => ({
    available: Object.fromEntries(LEAVE_TYPES.map((type) => [type, availableDays(db, user.id, type)])) as Record<LeaveType, number>,
    lastSaved: db.applications
      .filter((application) => application.employeeId === user.id)
      .reduce((latest, application) => (application.updatedAt > latest ? application.updatedAt : latest), ""),
  }));

  return (
    <>
      <h1 className="page-title mb-6">Apply for leave</h1>
      {/* The key starts a blank form after each save, since hidden routes keep their state. */}
      <LeaveForm key={lastSaved} available={available} today={today()} />
    </>
  );
}
