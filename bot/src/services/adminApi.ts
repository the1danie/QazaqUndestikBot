import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

import { config } from "../config";

export interface TheoryItem {
  id: number;
  title: string;
  content: string;
  order: number;
  imageUrl: string | null;
  topicId: number | null;
}

export interface VideoItem {
  id: number;
  title: string;
  url: string;
  description: string | null;
}

export interface TestQuestion {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string | null;
}

export interface Exercise {
  id: number;
  type: "suffix" | "choice" | "fill_blank";
  prompt: string;
  answer: string;
  correctOption?: "A" | "B" | "C" | "D";
  explanation: string | null;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  imageUrl: string | null;
}

export interface Task {
  id: number;
  title: string;
  content: string;
  order: number;
}

export interface Topic {
  id: number;
  name: string;
  order: number;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${config.ADMIN_BOT_SECRET}`,
    "Content-Type": "application/json",
  };
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
      }
    );

    req.on("error", reject);
    req.end();
  });
}

function httpPost(url: URL, headers: Record<string, string>, data: string): Promise<{ status: number; body: string }> {
  const requestImpl = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = requestImpl(
      url,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(data),
        },
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
      }
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function apiGet<T>(path: string): Promise<T[]> {
  const url = new URL(path, config.ADMIN_URL);
  const res = await httpGet(url, authHeaders());
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Admin API error ${res.status}: ${res.body}`);
  }
  return JSON.parse(res.body) as T[];
}

async function apiPost(path: string, body: Record<string, unknown>): Promise<void> {
  const url = new URL(path, config.ADMIN_URL);
  const res = await httpPost(url, authHeaders(), JSON.stringify(body));
  if (res.status < 200 || res.status >= 300) {
    throw new Error(`Admin API error ${res.status}: ${res.body}`);
  }
}

export const adminApiService = {
  getTheory(): Promise<TheoryItem[]> {
    return apiGet<TheoryItem>("/api/bot/theory");
  },

  getTheoryByTopic(topicId?: number): Promise<TheoryItem[]> {
    const path = topicId !== undefined
      ? `/api/bot/theory?topicId=${topicId}`
      : "/api/bot/theory";
    return apiGet<TheoryItem>(path);
  },

  getVideos(): Promise<VideoItem[]> {
    return apiGet<VideoItem>("/api/bot/videos");
  },

  getTestQuestions(): Promise<TestQuestion[]> {
    return apiGet<TestQuestion>("/api/bot/test-questions");
  },

  getExercises(): Promise<Exercise[]> {
    return apiGet<Exercise>("/api/bot/exercises");
  },

  getTasks(): Promise<Task[]> {
    return apiGet<Task>("/api/bot/tasks");
  },

  getTopics(): Promise<Topic[]> {
    return apiGet<Topic>("/api/bot/topics");
  },

  getExercisesByTopic(topicId?: number): Promise<Exercise[]> {
    const path = topicId !== undefined
      ? `/api/bot/exercises?topicId=${topicId}`
      : "/api/bot/exercises";
    return apiGet<Exercise>(path);
  },

  getTasksByTopic(topicId?: number): Promise<Task[]> {
    const path = topicId !== undefined
      ? `/api/bot/tasks?topicId=${topicId}`
      : "/api/bot/tasks";
    return apiGet<Task>(path);
  },

  getTestQuestionsByTopic(topicId?: number): Promise<TestQuestion[]> {
    const path = topicId !== undefined
      ? `/api/bot/test-questions?topicId=${topicId}`
      : "/api/bot/test-questions";
    return apiGet<TestQuestion>(path);
  },

  async upsertUser(telegramId: number, username?: string, firstName?: string, lastName?: string): Promise<void> {
    return apiPost("/api/bot/users/upsert", { telegramId, username, firstName, lastName });
  },

  async saveTestResult(telegramId: number, score: number, total: number): Promise<void> {
    return apiPost("/api/bot/results/test", { telegramId, score, total });
  },

  async saveExerciseResult(telegramId: number, exerciseId: number, isCorrect: boolean): Promise<void> {
    return apiPost("/api/bot/results/exercise", { telegramId, exerciseId, isCorrect });
  },
};
