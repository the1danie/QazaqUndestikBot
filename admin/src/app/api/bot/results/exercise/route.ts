import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function POST(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  try {
    const { telegramId, exerciseId, isCorrect } =
      (await request.json()) as {
        telegramId: number;
        exerciseId: number;
        isCorrect: boolean;
      };

    await db.exerciseResult.create({
      data: {
        userId: BigInt(telegramId),
        exerciseId,
        isCorrect,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
