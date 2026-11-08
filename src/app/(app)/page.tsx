import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { HOME } from "@/lib/nav";

export default async function HomePage() {
  const user = await requireUser();
  redirect(HOME[user.role]);
}
