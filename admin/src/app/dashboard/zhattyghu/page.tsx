import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { TaskItem, ExerciseItem } from "@/types";
import DeleteTaskButton from "./DeleteTaskButton";
import DeleteExerciseButton from "./DeleteExerciseButton";

export const dynamic = "force-dynamic";

export default async function ZhattyghuPage() {
  const [tasks, exercises] = await Promise.all([
    strapiList<TaskItem>("tasks", { "sort[0]": "order:asc" }),
    strapiList<ExerciseItem>("exercises"),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Жаттығу</h1>
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <span className="border-b-2 border-blue-600 pb-2 font-medium text-blue-600">Документ ({tasks.length})</span>
        <span className="pb-2 text-gray-500">Интерактивті ({exercises.length})</span>
      </div>

      {/* Document tasks */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Документ тапсырмалары</h2>
          <Link href="/dashboard/zhattyghu/document/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            + Қосу
          </Link>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 && <p className="text-gray-500 text-sm">Тапсырма жоқ.</p>}
          {tasks.map((item) => (
            <div key={item.documentId} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-medium">{item.title}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.publishedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {item.publishedAt ? "Жарияланған" : "Черновик"}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/zhattyghu/document/${item.documentId}`}
                  className="text-sm text-blue-600 hover:underline">Өңдеу</Link>
                <DeleteTaskButton documentId={item.documentId} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive exercises */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">Интерактивті жаттығулар</h2>
          <Link href="/dashboard/zhattyghu/interactive/new"
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
            + Қосу
          </Link>
        </div>
        <div className="space-y-3">
          {exercises.length === 0 && <p className="text-gray-500 text-sm">Жаттығу жоқ.</p>}
          {exercises.map((item) => (
            <div key={item.documentId} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{item.prompt}</p>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">{item.type}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.publishedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {item.publishedAt ? "Жарияланған" : "Черновик"}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href={`/dashboard/zhattyghu/interactive/${item.documentId}`}
                  className="text-sm text-blue-600 hover:underline">Өңдеу</Link>
                <DeleteExerciseButton documentId={item.documentId} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
