import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { DomainError } from "@/lib/errors";
import type { Attachment } from "@/lib/types";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 5 * 1024 * 1024;

function detectMime(bytes: Buffer): string | null {
  if (bytes.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (bytes.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return "image/png";
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  return null;
}

/** Stored under a generated id, so the uploaded name never touches the file system. */
export async function storeAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_BYTES) throw new DomainError("Upload a file of 5 MB or less.", "attachment");

  const bytes = Buffer.from(await file.arrayBuffer());
  const mime = detectMime(bytes);
  if (!mime) throw new DomainError("Upload a PDF, PNG or JPEG file.", "attachment");

  const id = randomUUID();
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, id), bytes);
  return { id, name: file.name.slice(0, 200), mime, size: file.size };
}

export function readAttachment(attachment: Attachment): Buffer {
  return fs.readFileSync(path.join(UPLOAD_DIR, attachment.id));
}

export function deleteAttachment(attachment: Attachment) {
  fs.rmSync(path.join(UPLOAD_DIR, attachment.id), { force: true });
}
