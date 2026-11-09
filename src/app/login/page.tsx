import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/auth";
import { signInWithKeycloak } from "@/lib/session-actions";

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

async function SignInForm({ searchParams }: { searchParams: SearchParams }) {
  const { callbackUrl = "/", error } = await searchParams;
  if ((await auth())?.user) redirect(callbackUrl.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/");

  return (
    <form action={signInWithKeycloak} className="mt-10">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {error && (
        <p role="alert" className="mb-4 max-w-prose text-red-700">
          Sign-in did not complete. Please try again.
        </p>
      )}
      <button type="submit" className="file-spine rounded px-5 py-3 font-semibold text-white hover:opacity-90">
        Sign in with Keycloak
      </button>
    </form>
  );
}

export default function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 md:py-20">
      <h1 className="page-title">Leave Register</h1>
      <p className="mt-2 max-w-prose text-muted">Sign in with your organisation account to open the register.</p>
      <Suspense fallback={<p className="mt-10 text-muted">Checking your session</p>}>
        <SignInForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
