import { type MyContext } from "../index";
import { mainMenuKeyboard } from "../keyboards/menus";
import { progressService } from "../services/progress";

export async function handleStart(ctx: MyContext): Promise<void> {
  const userId = BigInt(ctx.from!.id);
  const username = ctx.from?.username;
  await progressService.upsertUser(userId, username);

  await ctx.reply(
    "Сәлем! Мен үндестік заңын үйретемін 📚\n\nТөмендегі мәзірден бөлімді таңдаңыз:",
    { reply_markup: mainMenuKeyboard }
  );
}
