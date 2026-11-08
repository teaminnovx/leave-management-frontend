import { connection } from "next/server";
import { Suspense } from "react";
import { read } from "@/lib/db";
import { signIn } from "@/lib/session-actions";
import { ROLES, ROLE_LABELS } from "@/lib/types";

async function PeoplePicker() {
  await connection();
  const users = read((db) => db.users);

  return (
    <div className="mt-10 grid gap-8 md:grid-cols-3">
      {ROLES.map((role) => (
        <section key={role}>
          <h2 className="font-display text-lg font-semibold">{ROLE_LABELS[role]}</h2>
          <ul className="mt-2 border-t border-line">
            {users
              .filter((user) => user.role === role)
              .map((user) => (
                <li key={user.id} className="border-b border-line">
                  <form action={signIn}>
                    <input type="hidden" name="userId" value={user.id} />
                    <button type="submit" className="w-full px-2 py-3 text-left hover:bg-file/10">
                      <span className="block font-semibold">{user.name}</span>
                      <span className="block text-sm text-muted">{user.title}</span>
                    </button>
                  </form>
                </li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 md:py-20">
      <h1 className="page-title">Leave Register</h1>
      <p className="mt-2 max-w-prose text-muted">Choose who you are signing in as. Each role sees its own part of the process.</p>
      <Suspense fallback={<p className="mt-10 text-muted">Loading people</p>}>
        <PeoplePicker />
      </Suspense>
    </main>
  );
}
