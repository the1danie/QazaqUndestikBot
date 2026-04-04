import { request as httpsRequest } from "node:https";

import { config } from "../config";

const SYSTEM_PROMPT =
  "Сен 5-сынып оқушыларына арналған Telegram оқыту ботысың. Тақырып: қазақ тілінің үндестік заңы.\n" +
  "Ережелер:\n" +
  "- Тек осы тақырып бойынша қазақша жауап бер.\n" +
  "- Жауап қысқа болсын: 3-5 сөйлем.\n" +
  "- Кесте, ### тақырып, --- белгілер ҚОЛДАНБА.\n" +
  "- Тек *қалың* мәтін және қарапайым тізім нүктелері (•) қолдан.\n" +
  "- Мысал берсең, жақша ішінде жаз: (мысалы: үй → үйге).\n" +
  "- 5-сынып оқушысына түсінікті, қарапайым тілде жаз.";

function httpPost(url: URL, headers: Record<string, string>, data: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = httpsRequest(
      url,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { body += chunk; });
        res.on("end", () => resolve({ status: res.statusCode ?? 500, body }));
      },
    );
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

export const aiService = {
  async ask(userMessage: string): Promise<string> {
    const url = new URL("https://llm.alem.ai/chat/completions");

    const payload = JSON.stringify({
      model: "gpt-oss",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    });

    const res = await httpPost(url, {
      Authorization: `Bearer ${config.ALEM_API_KEY}`,
    }, payload);

    if (res.status < 200 || res.status >= 300) {
      throw new Error(`AI API error ${res.status}: ${res.body}`);
    }

    const json = JSON.parse(res.body) as {
      choices: Array<{ message: { content: string } }>;
    };

    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response");

    return content;
  },
};
