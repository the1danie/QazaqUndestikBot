import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
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
      topicId?: number | null;
    };
    const item = await db.exercise.create({
      data: { ...body, topicId: body.topicId ?? null, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
