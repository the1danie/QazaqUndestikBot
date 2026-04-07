import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { TestQuestionItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const item = await strapiCreate<TestQuestionItem>("test-questions", body);
    await strapiPublish("test-questions", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
