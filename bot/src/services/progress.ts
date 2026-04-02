import { prisma } from "../db/prisma";

export const progressService = {
  async upsertUser(userId: bigint, username?: string): Promise<void> {
    await prisma.user.upsert({
      where: { id: userId },
      update: { username: username ?? null },
      create: { id: userId, username: username ?? null },
    });
  },

  async saveTestResult(userId: bigint, score: number, total: number): Promise<void> {
    await prisma.testResult.create({
      data: { userId, score, total },
    });
  },

  async saveExerciseResult(userId: bigint, exerciseId: number, isCorrect: boolean): Promise<void> {
    await prisma.exerciseResult.create({
      data: { userId, exerciseId, isCorrect },
    });
  },
};
