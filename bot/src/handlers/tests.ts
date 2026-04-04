import { InlineKeyboard } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { progressService } from "../services/progress";
import { strapiService, type TestQuestion } from "../services/strapi";

export async function testsConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const questions = await conversation.external(() => strapiService.getTestQuestions());

  if (questions.length === 0) {
    await ctx.reply("Тест сұрақтары әлі жоқ.");
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

  const userId = BigInt(ctx.from!.id);
  await conversation.external(() =>
    progressService.saveTestResult(userId, score, questions.length)
  );

  // Update Strapi stats (non-blocking)
  strapiService.updateTestStats(Number(userId), score, questions.length)
    .catch((err) => console.error("Failed to update test stats:", err.message));

  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
