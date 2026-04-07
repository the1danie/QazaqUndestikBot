import { InlineKeyboard } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService, type TestQuestion, type Topic } from "../services/adminApi";

async function runTest(
  conversation: MyConversation,
  ctx: MyContext,
  questions: TestQuestion[]
): Promise<void> {
  if (questions.length === 0) {
    await ctx.reply("Бұл тақырып бойынша тест сұрақтары әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

  await ctx.reply(`📝 Тест басталды! ${questions.length} сұрақ бар.`);

  let score = 0;
  const results: Array<{
    question: TestQuestion;
    userAnswer: string;
    isCorrect: boolean;
  }> = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const kb = new InlineKeyboard()
      .text(`A. ${q.optionA}`, "A")
      .text(`B. ${q.optionB}`, "B")
      .row()
      .text(`C. ${q.optionC}`, "C")
      .text(`D. ${q.optionD}`, "D");

    await ctx.reply(`*Сұрақ ${i + 1}/${questions.length}*\n\n${q.question}`, {
      parse_mode: "Markdown",
      reply_markup: kb,
    });

    const cb = await conversation.waitForCallbackQuery(["A", "B", "C", "D"]);
    await cb.answerCallbackQuery();
    const userAnswer = cb.callbackQuery.data as "A" | "B" | "C" | "D";

    const isCorrect = userAnswer === q.correctOption;
    if (isCorrect) score++;
    results.push({ question: q, userAnswer, isCorrect });
  }

  const percent = Math.round((score / questions.length) * 100);
  await ctx.reply(`📊 *Нәтиже: ${score} / ${questions.length} (${percent}%)*`, {
    parse_mode: "Markdown",
  });

  for (const r of results) {
    const status = r.isCorrect ? "✅" : "❌";
    const text =
      `${status} ${r.question.question}\n` +
      `Сіздің жауабыңыз: *${r.userAnswer}* | Дұрыс: *${r.question.correctOption}*` +
      (r.question.explanation ? `\n\n${r.question.explanation}` : "");
    await ctx.reply(text, { parse_mode: "Markdown" });
  }

  const telegramId = ctx.from!.id;
  await conversation.external(() =>
    adminApiService.saveTestResult(telegramId, score, questions.length)
  );

  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}

export async function testsConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const topics = await conversation.external(() => adminApiService.getTopics());

  const topicKb = new InlineKeyboard();
  for (const topic of topics) {
    topicKb.text(topic.name, `topic_${topic.id}`).row();
  }
  topicKb.text("📋 Барлық тақырыптар", "topic_all").row();
  topicKb.text("⬅️ Мәзір", "menu");

  await ctx.reply("📚 Тақырып таңдаңыз:", { reply_markup: topicKb });

  const validCallbacks = [
    ...topics.map((t: Topic) => `topic_${t.id}`),
    "topic_all",
    "menu",
  ];
  const cb = await conversation.waitForCallbackQuery(validCallbacks);
  await cb.answerCallbackQuery();

  if (cb.callbackQuery.data === "menu") return;

  const selectedTopicId =
    cb.callbackQuery.data === "topic_all"
      ? undefined
      : Number(cb.callbackQuery.data.replace("topic_", ""));

  const questions = await conversation.external(() =>
    adminApiService.getTestQuestionsByTopic(selectedTopicId)
  );

  await runTest(conversation, ctx, questions);
}
