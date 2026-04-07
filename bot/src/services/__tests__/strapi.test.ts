import nock from "nock";
import { strapiService } from "../strapi";

const BASE = "http://localhost:1337";
const TOKEN = "test-token";

beforeEach(() => {
  process.env.STRAPI_URL = BASE;
  process.env.STRAPI_API_TOKEN = TOKEN;
});

afterEach(() => nock.cleanAll());

describe("strapiService.getTheory", () => {
  it("returns sorted theory items", async () => {
    nock(BASE)
      .get("/api/theories")
      .query({
        "sort[0]": "order:asc",
        "pagination[pageSize]": "100",
        "filters[publishedAt][$notNull]": "true",
      })
      .reply(200, {
        data: [
          { id: 1, title: "Буын үндестігі", content: "Мазмұн...", order: 1 },
          { id: 2, title: "Ілгерінді үндестік", content: "Мазмұн 2...", order: 2 },
        ],
        meta: {},
      });

    const items = await strapiService.getTheory();
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("Буын үндестігі");
    expect(items[0].id).toBe(1);
  });

  it("normalizes STRAPI_API_TOKEN when it includes Bearer prefix", async () => {
    process.env.STRAPI_API_TOKEN = "Bearer test-token";

    nock(BASE, {
      reqheaders: {
        authorization: "Bearer test-token",
      },
    })
      .get("/api/theories")
      .query({
        "sort[0]": "order:asc",
        "pagination[pageSize]": "100",
        "filters[publishedAt][$notNull]": "true",
      })
      .reply(200, { data: [], meta: {} });

    await expect(strapiService.getTheory()).resolves.toEqual([]);
  });

  it("throws actionable message on 401", async () => {
    nock(BASE)
      .get("/api/theories")
      .query({
        "sort[0]": "order:asc",
        "pagination[pageSize]": "100",
        "filters[publishedAt][$notNull]": "true",
      })
      .reply(401, {
        data: null,
        error: {
          status: 401,
          name: "UnauthorizedError",
          message: "Missing or invalid credentials",
          details: {},
        },
      });

    await expect(strapiService.getTheory()).rejects.toThrow("Strapi auth failed (401)");
  });
});

describe("strapiService.getVideos", () => {
  it("returns video list", async () => {
    nock(BASE)
      .get("/api/videos")
      .query({
        "pagination[pageSize]": "100",
        "filters[publishedAt][$notNull]": "true",
      })
      .reply(200, {
        data: [
          {
            id: 1,
            title: "Видео 1",
            url: "https://youtube.com/watch?v=xxx",
            description: "Сипаттама",
          },
        ],
        meta: {},
      });

    const videos = await strapiService.getVideos();
    expect(videos).toHaveLength(1);
    expect(videos[0].url).toBe("https://youtube.com/watch?v=xxx");
  });
});

describe("strapiService.getTestQuestions", () => {
  it("returns test questions", async () => {
    nock(BASE)
      .get("/api/test-questions")
      .query({
        "pagination[pageSize]": "100",
        "filters[publishedAt][$notNull]": "true",
      })
      .reply(200, {
        data: [
          {
            id: 1,
            question: "Сұрақ?",
            optionA: "А жауап",
            optionB: "Б жауап",
            optionC: "В жауап",
            optionD: "Г жауап",
            correctOption: "A",
            explanation: "Себебі...",
          },
        ],
        meta: {},
      });

    const questions = await strapiService.getTestQuestions();
    expect(questions).toHaveLength(1);
    expect(questions[0].correctOption).toBe("A");
  });
});

describe("strapiService.getExercises", () => {
  it("returns exercises", async () => {
    nock(BASE)
      .get("/api/exercises")
      .query({
        "pagination[pageSize]": "100",
        populate: "image",
        "filters[publishedAt][$notNull]": "true",
      })
      .reply(200, {
        data: [
          {
            id: 1,
            type: "fill_blank",
            prompt: "Толтырыңыз: кіт___",
            answer: "кітап",
            explanation: "Дұрыс жауап — кітап",
          },
        ],
        meta: {},
      });

    const exercises = await strapiService.getExercises();
    expect(exercises).toHaveLength(1);
    expect(exercises[0].type).toBe("fill_blank");
  });
});
