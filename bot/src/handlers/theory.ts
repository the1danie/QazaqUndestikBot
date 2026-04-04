import { InlineKeyboard } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { strapiService } from "../services/strapi";

export async function theoryConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const items = await conversation.external(() => strapiService.getTheory());

  if (items.length === 0) {
    await ctx.reply("Ереже материалдары әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

  const kb = new InlineKeyboard();
  items.forEach((item, i) => {
    kb.text(item.title, `t_${item.id}`);
    if (i % 2 === 1) kb.row();
  });
  kb.row().text("⬅️ Мәзірге оралу", "menu");

  await ctx.reply("Ережені таңдаңыз:", { reply_markup: kb });

  const callbackData = items.map((i) => `t_${i.id}`);
  const selection = await conversation.waitForCallbackQuery([...callbackData, "menu"]);
  await selection.answerCallbackQuery();

  if (selection.callbackQuery.data === "menu") return;

  const itemId = parseInt(selection.callbackQuery.data.replace("t_", ""));
  const item = items.find((i) => i.id === itemId);

  if (item) {
    await ctx.reply(`*${item.title}*\n\n${item.content}`, { parse_mode: "Markdown" });
  }

  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
