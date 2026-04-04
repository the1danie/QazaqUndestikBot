import "dotenv/config";
import { Bot, Context, session, SessionFlavor } from "grammy";
import {
  type Conversation,
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";

import { config } from "./config";
import { aiChatConversation } from "./handlers/aiChat";
import { exercisesConversation } from "./handlers/exercises";
import { handleStart } from "./handlers/start";
import { testsConversation } from "./handlers/tests";
import { theoryConversation } from "./handlers/theory";
import { videoConversation } from "./handlers/video";

type SessionData = Record<string, never>;
export type MyContext = Context & SessionFlavor<SessionData> & ConversationFlavor;
export type MyConversation = Conversation<MyContext>;

const bot = new Bot<MyContext>(config.BOT_TOKEN);

bot.use(session({ initial: (): SessionData => ({}) }));
bot.use(conversations());

bot.use(createConversation(theoryConversation, "theory"));
bot.use(createConversation(videoConversation, "video"));
bot.use(createConversation(exercisesConversation, "exercises"));
bot.use(createConversation(testsConversation, "tests"));
bot.use(createConversation(aiChatConversation, "aiChat"));

bot.command("start", handleStart);
bot.hears("📚 Ереже", (ctx) => ctx.conversation.enter("theory"));
bot.hears("📹 Видео", (ctx) => ctx.conversation.enter("video"));
bot.hears("✏️ Жаттығу", (ctx) => ctx.conversation.enter("exercises"));
bot.hears("📝 Тест", (ctx) => ctx.conversation.enter("tests"));
bot.hears("❓ Сұрақ қою", (ctx) => ctx.conversation.enter("aiChat"));

bot.catch((err) => {
  console.error("Bot error:", err);
});

bot.start();
console.log("Bot started");
