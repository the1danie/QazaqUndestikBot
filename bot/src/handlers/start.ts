import { type MyContext } from "../index";
import { mainMenuKeyboard } from "../keyboards/menus";
import { progressService } from "../services/progress";
import { strapiService } from "../services/strapi";

export async function handleStart(ctx: MyContext): Promise<void> {
  const userId = BigInt(ctx.from!.id);
  const username = ctx.from?.username;
  const firstName = ctx.from?.first_name;
  const lastName = ctx.from?.last_name;
  
  // Save to local Prisma DB
  await progressService.upsertUser(userId, username);
  
  // Save to Strapi (non-blocking, don't fail if Strapi is unavailable)
  strapiService.upsertTelegramUser(Number(userId), username, firstName, lastName)
    .catch((err) => console.error("Failed to save user to Strapi:", err.message));

  await ctx.reply(
    "Сәлем! Мен үндестік заңын үйретемін 📚\n\nТөмендегі мәзірден бөлімді таңдаңыз:",
    { reply_markup: mainMenuKeyboard }
  );
}
