import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function GET(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  const items = await db.topic.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}
