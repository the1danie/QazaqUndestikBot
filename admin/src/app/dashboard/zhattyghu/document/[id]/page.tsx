import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditTaskForm from "./EditTaskForm";
import type { TaskItem, TopicItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, topics] = await Promise.all([
    db.task.findUnique({ where: { id: Number(id) } }),
    db.topic.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тапсырманы өңдеу</h1>
      <EditTaskForm item={item as unknown as TaskItem} topics={topics as TopicItem[]} />
    </div>
  );
}
