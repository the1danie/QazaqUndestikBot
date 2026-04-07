import { strapiGetOne } from "@/lib/strapi";
import type { TaskItem } from "@/types";
import EditTaskForm from "./EditTaskForm";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<TaskItem>("tasks", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тапсырманы өңдеу</h1>
      <EditTaskForm item={item} />
    </div>
  );
}
