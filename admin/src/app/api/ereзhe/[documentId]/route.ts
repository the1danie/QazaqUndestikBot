import { NextResponse } from "next/server";
import { strapiUpdate, strapiDelete, strapiPublish, strapiUnpublish } from "@/lib/strapi";
import type { TheoryItem } from "@/types";

export async function PUT(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    const body = await request.json() as { title: string; content: string; published: boolean };
    const { published, ...data } = body;
    await strapiUpdate<TheoryItem>("theories", documentId, data);
    if (published) {
      await strapiPublish("theories", documentId);
    } else {
      await strapiUnpublish("theories", documentId);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  try {
    const { documentId } = await params;
    await strapiDelete("theories", documentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
