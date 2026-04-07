import { NextResponse } from "next/server";
import { strapiUpdate, strapiDelete, strapiPublish, strapiUnpublish } from "@/lib/strapi";
import type { TaskItem } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const body = await request.json() as { title: string; content: string; published: boolean };
    const { published, ...data } = body;
    await strapiUpdate<TaskItem>("tasks", documentId, data);
    if (published) await strapiPublish("tasks", documentId);
    else await strapiUnpublish("tasks", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    await strapiDelete("tasks", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
