import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/dates";
import { markNotificationsRead } from "@/modules/leave-tracking/actions";
import { getNotifications } from "@/modules/leave-tracking/service";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = getNotifications(user.id);
  const hasUnread = notifications.some((entry) => !entry.read);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Notifications</h1>
        {hasUnread && (
          <form action={markNotificationsRead}>
            <button type="submit" className="btn">
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {notifications.length === 0 ? (
        <p className="mt-6 text-muted">No notifications yet. Status changes on your applications appear here.</p>
      ) : (
        <ul className="mt-6 max-w-2xl border-t-2 border-file">
          {notifications.map((entry) => (
            <li key={entry.id} className={`border-b border-line px-3 py-3 ${entry.read ? "" : "border-l-4 border-l-tape bg-sheet"}`}>
              <Link href={`/applications/${entry.applicationId}`} className={`underline-offset-4 hover:underline ${entry.read ? "" : "font-semibold"}`}>
                {entry.message}
              </Link>
              <p className="text-sm text-muted">{formatDateTime(entry.at)}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
