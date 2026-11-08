import { currentUser } from "@/lib/auth";
import { LEAVE_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";
import { parseArchiveFilters, searchArchive } from "@/modules/leave-tracking/service";

function csvCell(value: string | number | null) {
  let text = String(value ?? "");
  // A leading formula character would run as a formula when opened in a spreadsheet.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (user?.role !== "HR_ADMIN") return new Response("Only HR can download this report.", { status: 403 });

  const { searchParams } = new URL(request.url);
  const results = searchArchive(parseArchiveFilters((key) => searchParams.get(key) ?? undefined));

  const header = ["Reference", "Employee", "Type", "Start", "End", "Days", "Status", "Reason"];
  const rows = results.map(({ application, employeeName }) => [
    application.ref,
    employeeName,
    LEAVE_TYPE_LABELS[application.type],
    application.startDate,
    application.endDate,
    application.days,
    STATUS_LABELS[application.status],
    application.reason,
  ]);
  const body = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");

  return new Response(`﻿${body}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leave-archive.csv"',
    },
  });
}
