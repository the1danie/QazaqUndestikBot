import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

import { config } from "../config";

// Strapi v5 REST API returns data without nested `attributes`
export interface TheoryItem {
  id: number;
  title: string;
  content: string;
  order: number;
}

export interface VideoItem {
  id: number;
  title: string;
  url: string;
  description: string;
}

export interface TestQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string;
}

export interface Exercise {
  id: number;
  type: "suffix" | "choice" | "fill_blank";
  prompt: string;
  answer: string;
  explanation: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  image?: { url: string };
}

function httpGet(url: URL, headers: Record<string, string>): Promise<{ status: number; body: string }> {
  const requestImpl = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = requestImpl(
      url,
      {
        method: "GET",
        headers,
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode ?? 500, body });
        });
      },
    );

    req.on("error", reject);
    req.end();
  });
}

async function strapiGet<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const url = new URL(path, config.STRAPI_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await httpGet(url, {
    Authorization: `Bearer ${config.STRAPI_API_TOKEN}`,
  });

  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Strapi error ${res.status}: ${res.body}`);
  }

  const json = JSON.parse(res.body) as { data: T[] };
  return json.data;
}

export const strapiService = {
  async getTheory(): Promise<TheoryItem[]> {
    return strapiGet<TheoryItem>("/api/theories", {
      "sort[0]": "order:asc",
      "pagination[pageSize]": "100",
      "filters[publishedAt][$notNull]": "true",
    });
  },

  async getVideos(): Promise<VideoItem[]> {
    return strapiGet<VideoItem>("/api/videos", {
      "pagination[pageSize]": "100",
      "filters[publishedAt][$notNull]": "true",
    });
  },

  async getTestQuestions(): Promise<TestQuestion[]> {
    return strapiGet<TestQuestion>("/api/test-questions", {
      "pagination[pageSize]": "100",
      "filters[publishedAt][$notNull]": "true",
    });
  },

  async getExercises(): Promise<Exercise[]> {
    return strapiGet<Exercise>("/api/exercises", {
      "pagination[pageSize]": "100",
      populate: "image",
      "filters[publishedAt][$notNull]": "true",
    });
  },
};
