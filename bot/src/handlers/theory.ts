import { InlineKeyboard, InputFile } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService, type Topic } from "../services/adminApi";
import { config } from "../config";

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${config.ADMIN_BOT_SECRET}` },
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

export async function theoryConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const topics = await conversation.external(() => adminApiService.getTopics());

  // Topic selection keyboard
  const topicKb = new InlineKeyboard();
  for (const topic of topics) {
    topicKb.text(topic.name, `topic_${topic.id}`).row();
  }
  topicKb.text("📋 Барлық тақырыптар", "topic_all").row();
  topicKb.text("⬅️ Мәзір", "menu");

  await ctx.reply("📚 Тақырып таңдаңыз:", { reply_markup: topicKb });

  const validTopicCallbacks = [
    ...topics.map((t: Topic) => `topic_${t.id}`),
    "topic_all",
    "menu",
  ];
  const topicCb = await conversation.waitForCallbackQuery(validTopicCallbacks);
  await topicCb.answerCallbackQuery();

  if (topicCb.callbackQuery.data === "menu") return;

  const selectedTopicId =
    topicCb.callbackQuery.data === "topic_all"
      ? undefined
      : Number(topicCb.callbackQuery.data.replace("topic_", ""));

  const selectedTopicName =
    topicCb.callbackQuery.data === "topic_all"
      ? "Барлық тақырыптар"
      : topics.find((t: Topic) => t.id === selectedTopicId)?.name ?? "";
  await topicCb.editMessageText(`📚 Тақырып: *${selectedTopicName}*`, { parse_mode: "Markdown" })
    .catch(() => {});

  const items = await conversation.external(() =>
    adminApiService.getTheoryByTopic(selectedTopicId)
  );

  if (items.length === 0) {
    await ctx.reply("Бұл тақырып бойынша ереже материалдары әлі жоқ.");
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
    const text = `*${item.title}*\n\n${item.content}`;
    if (item.imageUrl) {
      const imageUrl = item.imageUrl.startsWith("http")
        ? item.imageUrl
        : `${config.ADMIN_URL}${item.imageUrl}`;
      const imageBuffer = await fetchImageBuffer(imageUrl);
      if (imageBuffer) {
        try {
          const ext = item.imageUrl.split(".").pop()?.toLowerCase() ?? "jpg";
          const MAX = 1024;
          if (text.length <= MAX) {
            await ctx.replyWithPhoto(new InputFile(imageBuffer, `theory.${ext}`), {
              caption: text,
              parse_mode: "Markdown",
            });
          } else {
            // truncate at last newline before limit
            const cut = text.lastIndexOf("\n", MAX);
            const captionPart = cut > 0 ? text.slice(0, cut) : text.slice(0, MAX);
            const rest = text.slice(captionPart.length).trimStart();
            await ctx.replyWithPhoto(new InputFile(imageBuffer, `theory.${ext}`), {
              caption: captionPart,
              parse_mode: "Markdown",
            });
            if (rest) await ctx.reply(rest, { parse_mode: "Markdown" });
          }
        } catch (err) {
          console.error("Photo send failed:", err);
          await ctx.reply(text, { parse_mode: "Markdown" });
        }
        return;
      }
    }
    await ctx.reply(text, { parse_mode: "Markdown" });
  }

  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
