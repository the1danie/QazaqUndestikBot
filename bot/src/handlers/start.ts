import { type MyContext } from "../index";
import { mainMenuKeyboard } from "../keyboards/menus";
import { adminApiService } from "../services/adminApi";

export async function handleStart(ctx: MyContext): Promise<void> {
  const telegramId = ctx.from!.id;
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name;
  const lastName = ctx.from?.last_name;

  adminApiService
    .upsertUser(telegramId, username, firstName, lastName)
    .catch((err) => console.error("Failed to upsert user:", err.message));

  await ctx.reply(
    "Сәлем! Мен үндестік заңын үйретемін 📚\n\nТөмендегі мәзірден бөлімді таңдаңыз:",
    { reply_markup: mainMenuKeyboard }
  );
}
