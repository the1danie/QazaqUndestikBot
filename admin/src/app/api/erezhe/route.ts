import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { TheoryItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { title: string; content: string };
    const item = await strapiCreate<TheoryItem>("theories", body);
    await strapiPublish("theories", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
