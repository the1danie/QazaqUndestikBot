import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function POST(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  try {
    const { telegramId, score, total } =
      (await request.json()) as { telegramId: number; score: number; total: number };

    await db.testResult.create({
      data: {
        userId: BigInt(telegramId),
        score,
        total,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
