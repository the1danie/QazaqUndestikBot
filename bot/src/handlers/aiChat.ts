import { InlineKeyboard } from "grammy";

import { type MyConversation, type MyContext } from "../index";
import { mainMenuKeyboard } from "../keyboards/menus";
import { aiService } from "../services/ai";
import { strapiService } from "../services/strapi";

const MENU_BUTTON_TEXTS = new Set([
  "📚 Ереже",
  "📹 Видео",
  "✏️ Жаттығу",
  "📝 Тест",
  "❓ Сұрақ қою",
]);

const CONVERSATION_MAP: Record<string, string> = {
  "📚 Ереже": "theory",
  "📹 Видео": "video",
  "✏️ Жаттығу": "exercises",
  "📝 Тест": "tests",
};

export async function aiChatConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const exitKb = new InlineKeyboard().text("⬅️ Мәзірге оралу", "menu");

  // Load theory from Strapi once for the session
  const theoryItems = await conversation.external(() => strapiService.getTheory());
  const theoryContext = theoryItems.length > 0
    ? theoryItems.map((item) => `**${item.title}**\n${item.content}`).join("\n\n")
    : "";

  await ctx.reply(
    "❓ Сұрағыңызды жазыңыз. Мен қазақ тілі ережелері бойынша жауап беремін.\n" +
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

    // If user pressed a main menu button — exit and redirect
    if (MENU_BUTTON_TEXTS.has(userQuestion)) {
      const target = CONVERSATION_MAP[userQuestion];
      if (target) {
        await update.conversation.enter(target);
      } else {
        // "❓ Сұрақ қою" — already here, just re-prompt
        await update.reply(
          "❓ Сұрағыңызды жазыңыз:",
          { reply_markup: exitKb }
        );
      }
      return;
    }

    await ctx.reply("⏳ Жауап іздеуде...");

    let answer: string;
    try {
      answer = await conversation.external(() => aiService.ask(userQuestion, theoryContext));
    } catch (err) {
      console.error("AI error:", err);
      answer = "Кешіріңіз, қате пайда болды. Қайтадан сұраңыз.";
    }

    await ctx.reply(answer, { reply_markup: exitKb, parse_mode: "Markdown" });
  }
}
