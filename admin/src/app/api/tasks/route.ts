import { NextResponse } from "next/server";
import { strapiCreate, strapiPublish } from "@/lib/strapi";
import type { TaskItem } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { title: string; content: string };
    const item = await strapiCreate<TaskItem>("tasks", body);
    await strapiPublish("tasks", item.documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
