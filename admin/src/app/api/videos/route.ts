import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { VideoItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const item = await strapiCreate<VideoItem>("videos", body);
    await strapiPublish("videos", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
