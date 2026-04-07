import { strapiGetOne } from "@/lib/strapi";
import type { TestQuestionItem } from "@/types";
import EditTestForm from "./EditTestForm";

export const dynamic = "force-dynamic";

export default async function EditTestPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<TestQuestionItem>("test-questions", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тест сұрақты өңдеу</h1>
      <EditTestForm item={item} />
    </div>
  );
}
