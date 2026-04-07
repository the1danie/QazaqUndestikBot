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
  correctOption?: "A" | "B" | "C" | "D";
  explanation: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  image?: { url: string };
}

export interface Task {
  id: number;
  title: string;
  content: string;
  order: number;
}

export interface TelegramUser {
  id: number;
  documentId: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  currentLevel: number;
  totalScore: number;
  completedExercises: number[];
  completedTests: Array<{ date: string; score: number; total: number }>;
  lastActiveAt: string;
  isBlocked: boolean;
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

function httpPost(url: URL, headers: Record<string, string>, data: string): Promise<{ status: number; body: string }> {
  const requestImpl = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = requestImpl(
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
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ status: res.statusCode ?? 500, body });
        });
      },
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function httpPut(url: URL, headers: Record<string, string>, data: string): Promise<{ status: number; body: string }> {
  const requestImpl = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const req = requestImpl(
      url,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
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
      },
    );

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function getStrapiAuthHeaders(): Record<string, string> {
  // Accept either raw token or accidental "Bearer <token>" env value.
  const normalizedToken = config.STRAPI_API_TOKEN.replace(/^Bearer\s+/i, "").trim();
  return {
    Authorization: `Bearer ${normalizedToken}`,
  };
}

async function strapiGet<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
  const url = new URL(path, config.STRAPI_URL);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await httpGet(url, getStrapiAuthHeaders());

  if (res.status < 200 || res.status >= 300) {
    if (res.status === 401) {
      throw new Error(
        `Strapi auth failed (401). Check STRAPI_API_TOKEN and ensure it is the raw token value (without "Bearer "). ` +
          `If using Docker Compose, pass STRAPI_API_TOKEN to both bot and strapi services. Response: ${res.body}`,
      );
    }
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

  async getTasks(): Promise<Task[]> {
    return strapiGet<Task>("/api/tasks", {
      "sort[0]": "order:asc",
      "pagination[pageSize]": "100",
      "filters[publishedAt][$notNull]": "true",
    });
  },

  async upsertTelegramUser(telegramId: number, username?: string, firstName?: string, lastName?: string): Promise<void> {
    const url = new URL("/api/telegram-users", config.STRAPI_URL);
    url.searchParams.set("filters[telegramId][$eq]", telegramId.toString());

    const headers = getStrapiAuthHeaders();

    // Check if user exists
    const checkRes = await httpGet(url, headers);
    
    if (checkRes.status < 200 || checkRes.status >= 300) {
      // If check fails, try to create new user
      const createUrl = new URL("/api/telegram-users", config.STRAPI_URL);
      const userData = {
        telegramId: telegramId.toString(),
        username,
        firstName,
        lastName,
        lastActiveAt: new Date().toISOString(),
      };
      await httpPost(createUrl, headers, JSON.stringify({ data: userData }));
      return;
    }

    const existing = JSON.parse(checkRes.body) as { data: TelegramUser[] | null };

    const userData = {
      telegramId: telegramId.toString(),
      username,
      firstName,
      lastName,
      lastActiveAt: new Date().toISOString(),
    };

    if (existing.data && existing.data.length > 0) {
      // Update existing user
      const user = existing.data[0];
      const updateUrl = new URL(`/api/telegram-users/${user.documentId}`, config.STRAPI_URL);
      await httpPut(updateUrl, headers, JSON.stringify({ data: userData }));
    } else {
      // Create new user
      const createUrl = new URL("/api/telegram-users", config.STRAPI_URL);
      await httpPost(createUrl, headers, JSON.stringify({ data: userData }));
    }
  },

  async updateExerciseStats(telegramId: number, exerciseId: number, correct: boolean): Promise<void> {
    const url = new URL("/api/telegram-users", config.STRAPI_URL);
    url.searchParams.set("filters[telegramId][$eq]", telegramId.toString());

    const headers = getStrapiAuthHeaders();

    const checkRes = await httpGet(url, headers);
    if (checkRes.status < 200 || checkRes.status >= 300) return;

    const existing = JSON.parse(checkRes.body) as { data: TelegramUser[] | null };
    if (!existing.data || existing.data.length === 0) return;

    const user = existing.data[0];
    const completedExercises = user.completedExercises || [];
    
    // Add exercise if not already completed
    if (!completedExercises.includes(exerciseId)) {
      completedExercises.push(exerciseId);
    }

    const updateUrl = new URL(`/api/telegram-users/${user.documentId}`, config.STRAPI_URL);
    await httpPut(updateUrl, headers, JSON.stringify({
      data: {
        completedExercises,
        totalScore: (user.totalScore || 0) + (correct ? 10 : 0),
        lastActiveAt: new Date().toISOString(),
      }
    }));
  },

  async updateTestStats(telegramId: number, score: number, totalQuestions: number): Promise<void> {
    const url = new URL("/api/telegram-users", config.STRAPI_URL);
    url.searchParams.set("filters[telegramId][$eq]", telegramId.toString());

    const headers = getStrapiAuthHeaders();

    const checkRes = await httpGet(url, headers);
    if (checkRes.status < 200 || checkRes.status >= 300) return;

    const existing = JSON.parse(checkRes.body) as { data: TelegramUser[] | null };
    if (!existing.data || existing.data.length === 0) return;

    const user = existing.data[0];
    const completedTests = user.completedTests || [];
    
    // Add test result
    completedTests.push({ date: new Date().toISOString(), score, total: totalQuestions });

    const updateUrl = new URL(`/api/telegram-users/${user.documentId}`, config.STRAPI_URL);
    await httpPut(updateUrl, headers, JSON.stringify({
      data: {
        completedTests,
        totalScore: (user.totalScore || 0) + score,
        lastActiveAt: new Date().toISOString(),
      }
    }));
  },
};
