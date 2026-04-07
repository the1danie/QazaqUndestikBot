import nock from "nock";
import { adminApiService } from "../adminApi";

const BASE = "http://localhost:3000";
const SECRET = "test-secret";

beforeEach(() => {
  process.env.ADMIN_URL = BASE;
  process.env.ADMIN_BOT_SECRET = SECRET;
});

afterEach(() => nock.cleanAll());

describe("adminApiService.getTheory", () => {
  it("returns theory items sorted by order", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/theory")
      .reply(200, [
        { id: 1, title: "Буын үндестігі", content: "Мазмұн...", order: 1, published: true },
        { id: 2, title: "Ілгерінді үндестік", content: "Мазмұн 2...", order: 2, published: true },
      ]);

    const items = await adminApiService.getTheory();
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Буын үндестігі");
    expect(items[0].id).toBe(1);
  });

  it("throws on 401", async () => {
    nock(BASE).get("/api/bot/theory").reply(401, { error: "Unauthorized" });
    await expect(adminApiService.getTheory()).rejects.toThrow("Admin API error 401");
  });
});

describe("adminApiService.getVideos", () => {
  it("returns video list", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/videos")
      .reply(200, [
        { id: 1, title: "Видео 1", url: "https://youtube.com/watch?v=xxx", description: "Сипаттама", published: true },
      ]);

    const videos = await adminApiService.getVideos();
    expect(videos).toHaveLength(1);
    expect(videos[0].url).toBe("https://youtube.com/watch?v=xxx");
  });
});

describe("adminApiService.getTestQuestions", () => {
  it("returns test questions", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/test-questions")
      .reply(200, [
        {
          id: 1,
          question: "Сұрақ?",
          optionA: "А жауап",
          optionB: "Б жауап",
          optionC: "В жауап",
          optionD: "Г жауап",
          correctOption: "A",
          explanation: "Себебі...",
          published: true,
        },
      ]);

    const questions = await adminApiService.getTestQuestions();
    expect(questions).toHaveLength(1);
    expect(questions[0].correctOption).toBe("A");
  });
});

describe("adminApiService.getExercises", () => {
  it("returns exercises with imageUrl", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/exercises")
      .reply(200, [
        {
          id: 1,
          type: "fill_blank",
          prompt: "Толтырыңыз: кіт___",
          answer: "кітап",
          explanation: "Дұрыс жауап — кітап",
          imageUrl: null,
          published: true,
        },
      ]);

    const exercises = await adminApiService.getExercises();
    expect(exercises).toHaveLength(1);
    expect(exercises[0].type).toBe("fill_blank");
    expect(exercises[0].imageUrl).toBeNull();
  });
});

describe("adminApiService.getTasks", () => {
  it("returns tasks", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .get("/api/bot/tasks")
      .reply(200, [
        { id: 1, title: "Тапсырма 1", content: "Мазмұн", order: 1, published: true },
      ]);

    const tasks = await adminApiService.getTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe("Тапсырма 1");
  });
});

describe("adminApiService.upsertUser", () => {
  it("posts user data and resolves", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .post("/api/bot/users/upsert", { telegramId: 123, username: "alice", firstName: "Alice", lastName: undefined })
      .reply(200, { ok: true });

    await expect(
      adminApiService.upsertUser(123, "alice", "Alice", undefined)
    ).resolves.toBeUndefined();
  });
});

describe("adminApiService.saveTestResult", () => {
  it("posts test result and resolves", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .post("/api/bot/results/test", { telegramId: 123, score: 7, total: 10 })
      .reply(200, { ok: true });

    await expect(adminApiService.saveTestResult(123, 7, 10)).resolves.toBeUndefined();
  });
});

describe("adminApiService.saveExerciseResult", () => {
  it("posts exercise result and resolves", async () => {
    nock(BASE, { reqheaders: { authorization: `Bearer ${SECRET}` } })
      .post("/api/bot/results/exercise", { telegramId: 123, exerciseId: 5, isCorrect: true })
      .reply(200, { ok: true });

    await expect(adminApiService.saveExerciseResult(123, 5, true)).resolves.toBeUndefined();
  });
});
