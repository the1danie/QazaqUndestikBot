import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditErezheForm from "./EditErezheForm";
import type { TheoryItem, TopicItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditErezhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, topics] = await Promise.all([
    db.theory.findUnique({ where: { id: Number(id) } }),
    db.topic.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Ережені өңдеу</h1>
      <EditErezheForm item={item as TheoryItem} topics={topics as TopicItem[]} />
    </div>
  );
}
