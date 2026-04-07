import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      type: string;
      prompt: string;
      answer: string;
      correctOption?: string;
      optionA?: string;
      optionB?: string;
      optionC?: string;
      optionD?: string;
      explanation?: string;
      imageUrl?: string;
      published: boolean;
    };
    const item = await db.exercise.update({
      where: { id: Number(id) },
      data: body,
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
    await db.exercise.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
