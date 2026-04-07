import { NextResponse } from "next/server";
import { strapiUpdate, strapiDelete, strapiPublish, strapiUnpublish } from "@/lib/strapi";
import type { ExerciseItem } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const body = await request.json() as Record<string, unknown> & { published: boolean };
    const { published, ...data } = body;
    await strapiUpdate<ExerciseItem>("exercises", documentId, data);
    if (published) await strapiPublish("exercises", documentId);
    else await strapiUnpublish("exercises", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    await strapiDelete("exercises", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
