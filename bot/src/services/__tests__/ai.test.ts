import nock from "nock";
import { aiService } from "../ai";

const BASE = "https://api.openai.com";

beforeEach(() => {
  process.env.OPENAI_API_KEY = "test_key";
});

afterEach(() => nock.cleanAll());

describe("aiService.ask", () => {
  it("returns text from API response", async () => {
    nock(BASE)
      .post("/v1/chat/completions")
      .reply(200, {
        choices: [{ message: { content: "Тест жауабы" } }],
      });

    const answer = await aiService.ask("Үндестік заңы дегеніміз не?", "Үндестік заңы туралы материал.");
    expect(answer).toBe("Тест жауабы");
  });

  it("throws if empty content returned", async () => {
    nock(BASE)
      .post("/v1/chat/completions")
      .reply(200, { choices: [] });

    await expect(aiService.ask("Сұрақ", "")).rejects.toThrow("Empty AI response");
  });
});
