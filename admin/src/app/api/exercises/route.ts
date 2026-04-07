import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { ExerciseItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const item = await strapiCreate<ExerciseItem>("exercises", body);
    await strapiPublish("exercises", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
