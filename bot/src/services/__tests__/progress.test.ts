import { progressService } from "../progress";
import { prisma } from "../../db/prisma";

jest.mock("../../db/prisma", () => ({
  prisma: {
    user: {
      upsert: jest.fn(),
    },
    testResult: {
      create: jest.fn(),
    },
    exerciseResult: {
      create: jest.fn(),
    },
  },
}));

const mockedPrisma = prisma as jest.Mocked<typeof prisma>;

beforeEach(() => jest.clearAllMocks());

describe("progressService.upsertUser", () => {
  it("calls prisma.user.upsert with correct args", async () => {
    (mockedPrisma.user.upsert as jest.Mock).mockResolvedValue({});
    await progressService.upsertUser(BigInt(123), "alice");
    expect(mockedPrisma.user.upsert).toHaveBeenCalledWith({
      where: { id: BigInt(123) },
      update: { username: "alice" },
      create: { id: BigInt(123), username: "alice" },
    });
  });
});

describe("progressService.saveTestResult", () => {
  it("calls prisma.testResult.create with correct args", async () => {
    (mockedPrisma.testResult.create as jest.Mock).mockResolvedValue({});
    await progressService.saveTestResult(BigInt(123), 7, 10);
    expect(mockedPrisma.testResult.create).toHaveBeenCalledWith({
      data: { userId: BigInt(123), score: 7, total: 10 },
    });
  });
});

describe("progressService.saveExerciseResult", () => {
  it("calls prisma.exerciseResult.create with correct args", async () => {
    (mockedPrisma.exerciseResult.create as jest.Mock).mockResolvedValue({});
    await progressService.saveExerciseResult(BigInt(123), 5, true);
    expect(mockedPrisma.exerciseResult.create).toHaveBeenCalledWith({
      data: { userId: BigInt(123), exerciseId: 5, isCorrect: true },
    });
  });
});
