import { requireUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await requireUser();
  return (
    <>
      <h1 className="page-title">Welcome, {user.name}</h1>
      <p className="mt-2 text-muted">{user.title}</p>
    </>
  );
}
