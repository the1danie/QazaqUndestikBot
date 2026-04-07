import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as {
      question: string;
      optionA: string;
      optionB: string;
      optionC: string;
      optionD: string;
      correctOption: string;
      explanation?: string;
      published: boolean;
    };
    const item = await db.testQuestion.update({
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
    await db.testQuestion.delete({ where: { id: Number(id) } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
