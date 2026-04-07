import { InlineKeyboard, InputFile } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { progressService } from "../services/progress";
import { strapiService, type Exercise, type Task } from "../services/strapi";
import { config } from "../config";

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

async function showExercise(ctx: MyContext, exercise: Exercise): Promise<void> {
  const text = `✏️ Жаттығу\n\n${exercise.prompt}`;
  if (exercise.image?.url) {
    const internalUrl = exercise.image.url.startsWith("http")
      ? exercise.image.url
      : `${config.STRAPI_URL}${exercise.image.url}`;
    const imageBuffer = await fetchImageBuffer(internalUrl);
    if (imageBuffer) {
      await ctx.replyWithPhoto(new InputFile(imageBuffer, "exercise.png"), { caption: text });
    } else {
      await ctx.reply(text);
    }
  } else {
    await ctx.reply(text);
  }
}

async function getAnswer(
  conversation: MyConversation,
  ctx: MyContext,
  exercise: Exercise
): Promise<string> {
  if (exercise.type === "choice") {
    const kb = new InlineKeyboard()
      .text(`A. ${exercise.optionA ?? ""}`, "A")
      .text(`B. ${exercise.optionB ?? ""}`, "B")
      .row()
      .text(`C. ${exercise.optionC ?? ""}`, "C")
      .text(`D. ${exercise.optionD ?? ""}`, "D");
    await ctx.reply("Жауапты таңдаңыз:", { reply_markup: kb });
    const cb = await conversation.waitForCallbackQuery(["A", "B", "C", "D"]);
    await cb.answerCallbackQuery();
    return cb.callbackQuery.data;
  } else {
    await ctx.reply("Жауабыңызды жазыңыз:");
    const msg = await conversation.waitFor("message:text");
    return msg.message.text.trim().toLowerCase();
  }
}

export async function exercisesConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const [tasks, exercises] = await conversation.external(() =>
    Promise.all([strapiService.getTasks(), strapiService.getExercises()])
  );

  if (tasks.length === 0 && exercises.length === 0) {
    await ctx.reply("Жаттығулар әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

  // Show document tasks first
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    await ctx.reply(`📄 *${task.title}*\n\n${task.content}`, { parse_mode: "Markdown" });

    if (i < tasks.length - 1 || exercises.length > 0) {
      const navKb = new InlineKeyboard()
        .text("➡️ Келесі", "next")
        .text("⬅️ Мәзір", "menu");
      await ctx.reply("Жалғастырасыз ба?", { reply_markup: navKb });
      const nav = await conversation.waitForCallbackQuery(["next", "menu"]);
      await nav.answerCallbackQuery();
      if (nav.callbackQuery.data === "menu") return;
    }
  }

  // Then interactive exercises
  const userId = BigInt(ctx.from!.id);

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    await showExercise(ctx, exercise);
    const userAnswer = await getAnswer(conversation, ctx, exercise);

    const correctAnswer =
      exercise.type === "choice"
        ? (exercise.correctOption ?? exercise.answer).toUpperCase()
        : exercise.answer.trim().toLowerCase();

    const normalizedUser = exercise.type === "choice" ? userAnswer.toUpperCase() : userAnswer;
    const isCorrect = normalizedUser === correctAnswer;

    await conversation.external(() =>
      progressService.saveExerciseResult(userId, exercise.id, isCorrect)
    );

    strapiService
      .updateExerciseStats(Number(userId), exercise.id, isCorrect)
      .catch((err) => console.error("Failed to update exercise stats:", err.message));

    if (isCorrect) {
      await ctx.reply(`✅ Дұрыс!\n\n${exercise.explanation ?? ""}`);
    } else {
      const displayAnswer =
        exercise.type === "choice"
          ? (exercise.correctOption ?? exercise.answer).toUpperCase()
          : exercise.answer;
      await ctx.reply(
        `❌ Қате. Дұрыс жауап: *${displayAnswer}*\n\n${exercise.explanation ?? ""}`,
        { parse_mode: "Markdown" }
      );
    }

    if (i < exercises.length - 1) {
      const navKb = new InlineKeyboard()
        .text("➡️ Келесі жаттығу", "next")
        .text("⬅️ Мәзір", "menu");
      await ctx.reply("Жалғастырасыз ба?", { reply_markup: navKb });
      const nav = await conversation.waitForCallbackQuery(["next", "menu"]);
      await nav.answerCallbackQuery();
      if (nav.callbackQuery.data === "menu") return;
    }
  }

  await ctx.reply("🎉 Барлық жаттығулар аяқталды!");
  await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
  await conversation.waitForCallbackQuery("menu");
}
