import { InlineKeyboard, InputFile } from "grammy";

import { backToMenuInline } from "../keyboards/menus";
import { type MyConversation, type MyContext } from "../index";
import { adminApiService, type Exercise, type Task, type Topic } from "../services/adminApi";
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

async function showExercise(ctx: MyContext, exercise: Exercise): Promise<void> {
  const text = `✏️ Жаттығу\n\n${exercise.prompt}`;
  if (exercise.imageUrl) {
    const imageUrl = exercise.imageUrl.startsWith("http")
      ? exercise.imageUrl
      : `${config.ADMIN_URL}${exercise.imageUrl}`;
    const imageBuffer = await fetchImageBuffer(imageUrl);
    if (imageBuffer) {
      try {
        const ext = exercise.imageUrl!.split(".").pop()?.toLowerCase() ?? "jpg";
        await ctx.replyWithPhoto(new InputFile(imageBuffer, `exercise.${ext}`), { caption: text });
        return;
      } catch {
        // fall through to text reply
      }
    }
    await ctx.reply(text);
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

async function runExercises(
  conversation: MyConversation,
  ctx: MyContext,
  tasks: Task[],
  exercises: Exercise[]
): Promise<void> {
  if (tasks.length === 0 && exercises.length === 0) {
    await ctx.reply("Бұл тақырып бойынша жаттығулар әлі жоқ.");
    await ctx.reply("Мәзірге оралу:", { reply_markup: backToMenuInline });
    await conversation.waitForCallbackQuery("menu");
    return;
  }

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

  const telegramId = ctx.from!.id;

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
      adminApiService.saveExerciseResult(telegramId, exercise.id, isCorrect)
    );

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

export async function exercisesConversation(
  conversation: MyConversation,
  ctx: MyContext
): Promise<void> {
  const topics = await conversation.external(() => adminApiService.getTopics());

  // Build topic selection keyboard
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

  const selectedTopicName =
    cb.callbackQuery.data === "topic_all"
      ? "Барлық тақырыптар"
      : topics.find((t: Topic) => t.id === selectedTopicId)?.name ?? "";
  await cb.editMessageText(`📚 Тақырып: *${selectedTopicName}*`, { parse_mode: "Markdown" })
    .catch(() => {});

  const [tasks, exercises] = await conversation.external(() =>
    Promise.all([
      adminApiService.getTasksByTopic(selectedTopicId),
      adminApiService.getExercisesByTopic(selectedTopicId),
    ])
  );

  await runExercises(conversation, ctx, tasks, exercises);
}
