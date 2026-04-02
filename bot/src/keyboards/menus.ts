import { InlineKeyboard, Keyboard } from "grammy";

export const mainMenuKeyboard = new Keyboard()
  .text("📚 Теория")
  .text("📹 Видео")
  .row()
  .text("✏️ Жаттығу")
  .text("📝 Тест")
  .row()
  .text("❓ Сұрақ қою")
  .resized();

export const backToMenuInline = new InlineKeyboard().text("⬅️ Мәзірге оралу", "menu");
