import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isBotAuthorized, unauthorizedResponse } from "@/lib/botAuth";

export async function POST(request: Request) {
  if (!isBotAuthorized(request)) return unauthorizedResponse();
  try {
    const { telegramId, username, firstName, lastName } =
      (await request.json()) as {
        telegramId: number;
        username?: string;
        firstName?: string;
        lastName?: string;
      };

    await db.telegramUser.upsert({
      where: { id: BigInt(telegramId) },
      create: {
        id: BigInt(telegramId),
        username,
        firstName,
        lastName,
        lastActiveAt: new Date(),
      },
      update: {
        username,
        firstName,
        lastName,
        lastActiveAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
