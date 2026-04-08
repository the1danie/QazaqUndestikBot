// Prisma-based types - id is number, published is boolean

export interface TheoryItem {
  id: number;
  title: string;
  content: string;
  order: number;
  imageUrl: string | null;
  topicId: number | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskItem {
  id: number;
  title: string;
  content: string;
  order: number;
  topicId: number | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseItem {
  id: number;
  type: "suffix" | "choice" | "fill_blank";
  prompt: string;
  answer: string;
  correctOption: "A" | "B" | "C" | "D" | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  explanation: string | null;
  imageUrl: string | null;
  topicId: number | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestQuestionItem {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string | null;
  topicId: number | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoItem {
  id: number;
  title: string;
  url: string;
  description: string | null;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicItem {
  id: number;
  name: string;
}
