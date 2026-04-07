import { strapiGetOne } from "@/lib/strapi";
import type { ExerciseItem } from "@/types";
import EditExerciseForm from "./EditExerciseForm";

export const dynamic = "force-dynamic";

export default async function EditExercisePage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<ExerciseItem>("exercises", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаттығуды өңдеу</h1>
      <EditExerciseForm item={item} />
    </div>
  );
}
