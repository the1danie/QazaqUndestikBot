import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title, content, published, imageUrl, topicId } =
      (await request.json()) as { title: string; content: string; published: boolean; imageUrl?: string | null; topicId?: number | null };
    const item = await db.theory.update({
      where: { id: Number(id) },
      data: { title, content, published, imageUrl: imageUrl ?? null, topicId: topicId ?? null },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.theory.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
