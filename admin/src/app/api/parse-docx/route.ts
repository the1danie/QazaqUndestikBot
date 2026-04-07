import { NextResponse } from "next/server";
import mammoth from "mammoth";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await mammoth.extractRawText({ buffer });
    return NextResponse.json({ text: result.value.trim() });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
