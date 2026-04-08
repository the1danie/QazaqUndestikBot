import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const items = await db.topic.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const { name } = (await request.json()) as { name: string };
    const item = await db.topic.create({ data: { name } });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
