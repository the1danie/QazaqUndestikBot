import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditExerciseForm from "./EditExerciseForm";
import type { ExerciseItem, TopicItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, topics] = await Promise.all([
    db.exercise.findUnique({ where: { id: Number(id) } }),
    db.topic.findMany({ orderBy: { order: "asc" } }),
  ]);
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаттығуды өңдеу</h1>
      <EditExerciseForm item={item as unknown as ExerciseItem} topics={topics as TopicItem[]} />
    </div>
  );
}
