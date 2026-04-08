import Link from "next/link";
import { db } from "@/lib/db";
import DeleteTaskButton from "./DeleteTaskButton";
import DeleteExerciseButton from "./DeleteExerciseButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ZhattyghuPage() {
  const [tasks, exercises, topics] = await Promise.all([
    db.task.findMany({ orderBy: { order: "asc" } }),
    db.exercise.findMany(),
    db.topic.findMany({ orderBy: { name: "asc" } }),
  ]);

  const topicMap = new Map(topics.map((t) => [t.id, t.name]));

  function topicLabel(topicId: number | null) {
    if (!topicId) return "Тақырыпсыз";
    return topicMap.get(topicId) ?? "Тақырыпсыз";
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Жаттығу</h1>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Документ тапсырмалары ({tasks.length})
          </h2>
          <Button asChild size="sm">
            <Link href="/dashboard/zhattyghu/document/new">
              <Plus className="mr-1 h-4 w-4" /> Қосу
            </Link>
          </Button>
        </div>
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-sm">Тапсырма жоқ.</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            {tasks.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors${idx < tasks.length - 1 ? " border-b" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium truncate">{item.title}</span>
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                    {topicLabel(item.topicId)}
                  </span>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${item.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.published ? "Жарияланған" : "Черновик"}
                  </span>
                </div>
                <div className="flex gap-1 ml-4 shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/document/${item.id}`}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteTaskButton id={item.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Интерактивті жаттығулар ({exercises.length})
          </h2>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/zhattyghu/interactive/new">
              <Plus className="mr-1 h-4 w-4" /> Қосу
            </Link>
          </Button>
        </div>
        {exercises.length === 0 ? (
          <p className="text-muted-foreground text-sm">Жаттығу жоқ.</p>
        ) : (
          <div className="rounded-lg border bg-card overflow-hidden">
            {exercises.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors${idx < exercises.length - 1 ? " border-b" : ""}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-sm truncate">{item.prompt}</span>
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                    {topicLabel(item.topicId)}
                  </span>
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">
                    {item.type}
                  </span>
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${item.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {item.published ? "Жарияланған" : "Черновик"}
                  </span>
                </div>
                <div className="flex gap-1 ml-4 shrink-0">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/interactive/${item.id}`}>
                      <Pencil className="mr-1 h-3.5 w-3.5" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteExerciseButton id={item.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
