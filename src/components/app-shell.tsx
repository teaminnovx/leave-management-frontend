import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { read } from "@/lib/db";
import { NAV } from "@/lib/nav";
import { signOutEverywhere } from "@/lib/session-actions";
import { ROLE_LABELS } from "@/lib/types";

export async function AppShell({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const unread = read((db) => db.notifications.filter((entry) => entry.userId === user.id && !entry.read).length);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="file-spine flex shrink-0 flex-col gap-6 px-5 py-6 text-white md:sticky md:top-0 md:h-screen md:w-64">
        <Link href="/" className="font-display text-xl font-semibold leading-tight">
          Leave Register
        </Link>
        <nav aria-label="Main" className="flex flex-wrap gap-x-4 gap-y-2 md:flex-col md:gap-1">
          {NAV[user.role].map((item) => (
            <Link key={item.href} href={item.href} className="spine-link">
              {item.label}
            </Link>
          ))}
          <Link href="/notifications" className="spine-link">
            Notifications
            {unread > 0 && <span className="ml-2 rounded-full bg-tape px-2 text-sm font-semibold">{unread}</span>}
          </Link>
          <Link href="/api-check" className="spine-link">
            API check
          </Link>
        </nav>
        <div className="md:mt-auto">
          <p className="font-semibold leading-snug">{user.name}</p>
          <p className="text-sm text-white/75">{ROLE_LABELS[user.role]}</p>
          <form action={signOutEverywhere} className="mt-2">
            <button type="submit" className="text-sm underline underline-offset-4 hover:text-white/80">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-10 md:py-12">{children}</main>
    </div>
  );
}
