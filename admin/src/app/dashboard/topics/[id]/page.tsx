import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditTopicForm from "./EditTopicForm";
import type { TopicItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditTopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.topic.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">Тақырыпты өңдеу</h1>
      <EditTopicForm item={item as TopicItem} />
    </div>
  );
}
