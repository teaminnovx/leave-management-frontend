const TIME_ZONE = "Asia/Dhaka";
const DAY_MS = 86_400_000;

/** Today's calendar date in Dhaka as YYYY-MM-DD. */
export function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(new Date());
}

/** Inclusive count of calendar days. */
export function countDays(start: string, end: string): number {
  return Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS) + 1;
}

export function formatDate(date: string | null): string {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date));
}

export function formatDateTime(timestamp: string): string {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: TIME_ZONE }).format(
    new Date(timestamp),
  );
}
