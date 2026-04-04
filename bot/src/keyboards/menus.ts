import { InlineKeyboard, Keyboard } from "grammy";

export const mainMenuKeyboard = new Keyboard()
  .text("📚 Ереже")
  .text("📹 Видео")
  .row()
  .text("✏️ Жаттығу")
  .text("📝 Тест")
  .row()
  .text("❓ Сұрақ қою")
  .resized();

export const backToMenuInline = new InlineKeyboard().text("⬅️ Мәзірге оралу", "menu");
