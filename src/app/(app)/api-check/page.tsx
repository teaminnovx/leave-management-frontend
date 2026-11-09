import { requireUser } from "@/lib/auth";
import { probe, type BackendResult } from "@/lib/backend";

const PATHS = ["/api/v1/leaves/whoami", "/api/v1/leaves/ping-employee"];

function ResultCard({ result }: { result: BackendResult }) {
  const ok = result.status !== null && result.status < 400;
  return (
    <section className="border-t-2 border-file pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-sm font-semibold break-all">GET {result.path}</h2>
        <span className={`font-semibold ${ok ? "text-green-700" : "text-red-700"}`}>{result.status ?? "No response"}</span>
      </div>
      {result.error && <p className="mt-1 text-sm text-muted">{result.error}</p>}
      <pre className="mt-3 overflow-x-auto rounded bg-sheet p-3 text-sm">
        {result.data === null || result.data === "" ? "(empty body)" : typeof result.data === "string" ? result.data : JSON.stringify(result.data, null, 2)}
      </pre>
    </section>
  );
}

export default async function ApiCheckPage() {
  await requireUser();
  const results = await Promise.all(PATHS.map(probe));

  return (
    <>
      <h1 className="page-title">API check</h1>
      <p className="mt-2 max-w-prose text-muted">
        Calls the leave API at <code>{process.env.BACKEND_API_URL}</code> with your Keycloak access token.
      </p>
      <div className="mt-8 grid max-w-3xl gap-8">
        {results.map((result) => (
          <ResultCard key={result.path} result={result} />
        ))}
      </div>
    </>
  );
}
