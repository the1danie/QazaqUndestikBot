import { InlineKeyboard } from "grammy";

import { type MyConversation, type MyContext } from "../index";
import { aiService } from "../services/ai";

export async function aiChatConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const exitKb = new InlineKeyboard().text("⬅️ Мәзірге оралу", "menu");

  await ctx.reply(
    "❓ Сұрағыңызды жазыңыз. Мен үндестік заңы туралы қазақша жауап беремін.\n" +
      "Шығу үшін төмендегі батырманы басыңыз.",
    { reply_markup: exitKb }
  );

  while (true) {
    const update = await conversation.waitUntil(
      (c) => c.callbackQuery?.data === "menu" || c.message?.text !== undefined
    );

    if (update.callbackQuery?.data === "menu") {
      await update.answerCallbackQuery();
      return;
    }

    const userQuestion = update.message!.text!;

    await ctx.reply("⏳ Жауап іздеуде...");

    let answer: string;
    try {
      answer = await conversation.external(() => aiService.ask(userQuestion));
    } catch {
      answer = "Кешіріңіз, қате пайда болды. Қайтадан сұраңыз.";
    }

    await ctx.reply(answer, { reply_markup: exitKb });
  }
}
