import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditExerciseForm from "./EditExerciseForm";
import type { ExerciseItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.exercise.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаттығуды өңдеу</h1>
      <EditExerciseForm item={item as unknown as ExerciseItem} />
    </div>
  );
}
