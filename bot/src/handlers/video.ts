import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService } from "../services/adminApi";

export async function videoConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const videos = await conversation.external(() => adminApiService.getVideos());

  if (videos.length === 0) {
    await ctx.reply("Видеолар әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

  for (const video of videos) {
    const text =
      `📹 *${video.title}*\n` +
      (video.description ? `${video.description}\n\n` : "") +
      `🔗 ${video.url}`;
    await ctx.reply(text, { parse_mode: "Markdown" });
  }

  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
