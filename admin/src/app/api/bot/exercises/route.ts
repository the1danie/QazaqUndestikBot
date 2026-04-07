import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const { searchParams } = new URL(request.url);
  const topicIdParam = searchParams.get("topicId");
  const where = topicIdParam
    ? { published: true, topicId: Number(topicIdParam) }
    : { published: true };
  const items = await db.exercise.findMany({ where });
  return NextResponse.json(items);
}
