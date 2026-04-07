export interface StrapiItem {
  id: number;
  documentId: string;
  publishedAt: string | null;
}

export interface TheoryItem extends StrapiItem {
  title: string;
  content: string;
  order: number;
}

export interface TaskItem extends StrapiItem {
  title: string;
  content: string;
  order: number;
}

export interface ExerciseItem extends StrapiItem {
  type: "suffix" | "choice" | "fill_blank";
  prompt: string;
  answer: string;
  correctOption: "A" | "B" | "C" | "D" | null;
  explanation: string | null;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
}

export interface TestQuestionItem extends StrapiItem {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: "A" | "B" | "C" | "D";
  explanation: string | null;
}

export interface VideoItem extends StrapiItem {
  title: string;
  url: string;
  description: string | null;
}
