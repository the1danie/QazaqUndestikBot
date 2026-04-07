import { progressService } from "../progress";
import { adminApiService } from "../adminApi";

jest.mock("../adminApi", () => ({
  adminApiService: {
    upsertUser: jest.fn(),
    saveTestResult: jest.fn(),
    saveExerciseResult: jest.fn(),
  },
}));

const mockedApi = adminApiService as jest.Mocked<typeof adminApiService>;

beforeEach(() => jest.clearAllMocks());

describe("progressService.upsertUser", () => {
  it("delegates to adminApiService.upsertUser", async () => {
    mockedApi.upsertUser.mockResolvedValue(undefined);
    await progressService.upsertUser(123, "alice", "Alice", "Smith");
    expect(mockedApi.upsertUser).toHaveBeenCalledWith(123, "alice", "Alice", "Smith");
  });
});

describe("progressService.saveTestResult", () => {
  it("delegates to adminApiService.saveTestResult", async () => {
    mockedApi.saveTestResult.mockResolvedValue(undefined);
    await progressService.saveTestResult(123, 7, 10);
    expect(mockedApi.saveTestResult).toHaveBeenCalledWith(123, 7, 10);
  });
});

describe("progressService.saveExerciseResult", () => {
  it("delegates to adminApiService.saveExerciseResult", async () => {
    mockedApi.saveExerciseResult.mockResolvedValue(undefined);
    await progressService.saveExerciseResult(123, 5, true);
    expect(mockedApi.saveExerciseResult).toHaveBeenCalledWith(123, 5, true);
  });
});
