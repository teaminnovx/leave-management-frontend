import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { availableDays } from "@/lib/balances";
import { today } from "@/lib/dates";
import { read } from "@/lib/db";
import { LEAVE_TYPES, type LeaveType } from "@/lib/types";
import { LeaveForm } from "@/modules/leave-request/leave-form";
import { EDITABLE_STATUSES } from "@/modules/leave-request/service";

export default async function EditApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireRole("EMPLOYEE");
  const data = read((db) => {
    const application = db.applications.find((entry) => entry.id === id && entry.employeeId === user.id);
    if (!application || !EDITABLE_STATUSES.includes(application.status)) return null;
    const available = Object.fromEntries(LEAVE_TYPES.map((type) => [type, availableDays(db, user.id, type, id)])) as Record<LeaveType, number>;
    return { application, available };
  });
  if (!data) notFound();

  return (
    <>
      <h1 className="page-title mb-6">Edit {data.application.ref}</h1>
      {data.application.status === "RETURNED" && data.application.reviewComment && (
        <section className="mb-6 max-w-xl border-l-4 border-tape bg-sheet px-4 py-3">
          <h2 className="font-semibold">Changes requested</h2>
          <p className="mt-1 whitespace-pre-wrap">{data.application.reviewComment}</p>
        </section>
      )}
      <LeaveForm key={data.application.updatedAt} application={data.application} available={data.available} today={today()} />
    </>
  );
}
