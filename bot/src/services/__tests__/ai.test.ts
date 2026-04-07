import { aiService } from "../ai";

// Mock @anthropic-ai/sdk
jest.mock("@anthropic-ai/sdk", () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: "text", text: "Тест жауабы" }],
      }),
    },
  })),
}));

describe("aiService.ask", () => {
  it("returns text from Claude response", async () => {
    const answer = await aiService.ask("Үндестік заңы дегеніміз не?", "Үндестік заңы туралы материал.");
    expect(answer).toBe("Тест жауабы");
  });

  it("throws if no text content returned", async () => {
    const Anthropic = require("@anthropic-ai/sdk").default;
    Anthropic.mockImplementationOnce(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({ content: [] }),
      },
    }));

    await expect(aiService.ask("Сұрақ", "")).rejects.toThrow("No text content in AI response");
  });
});
