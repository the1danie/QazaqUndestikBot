import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { title, content, topicId } = (await request.json()) as {
      title: string;
      content: string;
      topicId?: number | null;
    };
    const maxOrder = await db.task.aggregate({ _max: { order: true } });
    const order = (maxOrder._max.order ?? -1) + 1;
    const item = await db.task.create({
      data: { title, content, order, published: true, topicId: topicId ?? null },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
