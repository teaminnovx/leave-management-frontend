import { canView } from "@/lib/access";
import { currentUser } from "@/lib/auth";
import { read } from "@/lib/db";
import { readAttachment } from "@/modules/leave-request/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) return new Response("Sign in to download this file.", { status: 401 });

  const attachment = read((db) => {
    const application = db.applications.find((entry) => entry.attachment?.id === id);
    return application && canView(db, user, application) ? application.attachment : null;
  });
  if (!attachment) return new Response("File not found.", { status: 404 });

  return new Response(new Uint8Array(readAttachment(attachment)), {
    headers: {
      "Content-Type": attachment.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
