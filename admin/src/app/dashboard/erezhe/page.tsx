import Link from "next/link";
import { db } from "@/lib/db";
import DeleteButton from "./DeleteButton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ErezhePage() {
  const [items, topics] = await Promise.all([
    db.theory.findMany({ orderBy: { order: "asc" } }),
    db.topic.findMany({ orderBy: { name: "asc" } }),
  ]);
  const topicMap = new Map(topics.map((t) => [t.id, t.name]));

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Ереже</h1>
        <Button asChild>
          <Link href="/dashboard/erezhe/new">
            <Plus className="mr-1 h-4 w-4" /> Қосу
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm">Ереже жоқ.</p>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors${idx < items.length - 1 ? " border-b" : ""}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-medium truncate">{item.title}</span>
                {item.topicId && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">
                    {topicMap.get(item.topicId) ?? ""}
                  </span>
                )}
                {!item.topicId && (
                  <span className="shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-500">
                    Тақырыпсыз
                  </span>
                )}
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${item.published ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {item.published ? "Жарияланған" : "Черновик"}
                </span>
              </div>
              <div className="flex gap-1 ml-4 shrink-0">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/dashboard/erezhe/${item.id}`}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Өңдеу
                  </Link>
                </Button>
                <DeleteButton id={item.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
