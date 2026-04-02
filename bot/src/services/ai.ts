import Anthropic from "@anthropic-ai/sdk";

import { config } from "../config";

const SYSTEM_PROMPT =
  "Сен 5-сынып оқушыларына арналған оқыту ботысың. Тақырып: қазақ тілінің үндестік заңы. " +
  "Тек осы тақырып бойынша қазақша жауап бер, қысқа және түсінікті етіп.";

function createClient(): Anthropic {
  const apiKey =
    process.env.NODE_ENV === "test"
      ? process.env.ANTHROPIC_API_KEY ?? "test-key"
      : config.ANTHROPIC_API_KEY;

  const AnthropicClient =
    (Anthropic as unknown as { default?: typeof Anthropic }).default ?? Anthropic;

  return new AnthropicClient({ apiKey });
}

export const aiService = {
  async ask(userMessage: string): Promise<string> {
    const response = await createClient().messages.create({
      model: "claude-haiku-20240307",
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text content in AI response");
    }

    return textBlock.text;
  },
};
