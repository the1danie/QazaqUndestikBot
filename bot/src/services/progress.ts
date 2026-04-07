import { adminApiService } from "./adminApi";

export const progressService = {
  async upsertUser(telegramId: number, username?: string, firstName?: string, lastName?: string): Promise<void> {
    await adminApiService.upsertUser(telegramId, username, firstName, lastName);
  },

  async saveTestResult(telegramId: number, score: number, total: number): Promise<void> {
    await adminApiService.saveTestResult(telegramId, score, total);
  },

  async saveExerciseResult(telegramId: number, exerciseId: number, isCorrect: boolean): Promise<void> {
    await adminApiService.saveExerciseResult(telegramId, exerciseId, isCorrect);
  },
};
