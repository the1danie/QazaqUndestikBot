import Link from "next/link";
import { db } from "@/lib/db";
import DeleteTaskButton from "./DeleteTaskButton";
import DeleteExerciseButton from "./DeleteExerciseButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ZhattyghuPage() {
  const [tasks, exercises] = await Promise.all([
    db.task.findMany({ orderBy: { order: "asc" } }),
    db.exercise.findMany(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Жаттығу</h1>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">
            Документ тапсырмалары ({tasks.length})
          </h2>
          <Button asChild size="sm">
            <Link href="/dashboard/zhattyghu/document/new">
              <Plus className="mr-1 h-4 w-4" /> Қосу
            </Link>
          </Button>
        </div>
        <div className="space-y-3">
          {tasks.length === 0 && (
            <p className="text-gray-500 text-sm">Тапсырма жоқ.</p>
          )}
          {tasks.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">{item.title}</p>
                  <Badge variant={item.published ? "default" : "secondary"}>
                    {item.published ? "Жарияланған" : "Черновик"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/document/${item.id}`}>
                      <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteTaskButton id={item.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-gray-700">
            Интерактивті жаттығулар ({exercises.length})
          </h2>
          <Button asChild size="sm" variant="secondary">
            <Link href="/dashboard/zhattyghu/interactive/new">
              <Plus className="mr-1 h-4 w-4" /> Қосу
            </Link>
          </Button>
        </div>
        <div className="space-y-3">
          {exercises.length === 0 && (
            <p className="text-gray-500 text-sm">Жаттығу жоқ.</p>
          )}
          {exercises.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{item.prompt}</p>
                  <div className="flex gap-2">
                    <Badge variant="outline">{item.type}</Badge>
                    <Badge variant={item.published ? "default" : "secondary"}>
                      {item.published ? "Жарияланған" : "Черновик"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/zhattyghu/interactive/${item.id}`}>
                      <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                    </Link>
                  </Button>
                  <DeleteExerciseButton id={item.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
