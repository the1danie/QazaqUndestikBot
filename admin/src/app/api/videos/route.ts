import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title: string;
      url: string;
      description?: string;
    };
    const item = await db.video.create({
      data: { ...body, published: true },
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
