import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOADS_DIR = join(process.cwd(), "uploads");

export async function POST(request: Request) {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const filename = `${randomUUID()}.${ext}`;
    const bytes = await file.arrayBuffer();

    await writeFile(join(UPLOADS_DIR, filename), Buffer.from(bytes));

    return NextResponse.json({ url: `/api/files/${filename}` });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
