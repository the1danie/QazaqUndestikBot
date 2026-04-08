import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { title, content, imageUrl, topicId } = (await request.json()) as {
      title: string;
      content: string;
      imageUrl?: string;
      topicId?: number | null;
    };
    const item = await db.theory.create({
      data: { title, content, imageUrl: imageUrl ?? null, topicId: topicId ?? null, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
