import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

const UPLOADS_DIR = join(process.cwd(), "uploads");

export async function GET(
  _: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    // Prevent path traversal
    if (filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }
    const buffer = await readFile(join(UPLOADS_DIR, filename));
    const ext = filename.split(".").pop() ?? "bin";
    const contentType =
      ext === "png"
        ? "image/png"
        : ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "gif"
            ? "image/gif"
            : ext === "webp"
              ? "image/webp"
              : "application/octet-stream";

    return new Response(buffer, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
