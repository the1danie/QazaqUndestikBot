import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditTestForm from "./EditTestForm";
import type { TestQuestionItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditTestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.testQuestion.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тест сұрақты өңдеу</h1>
      <EditTestForm item={item as unknown as TestQuestionItem} />
    </div>
  );
}
