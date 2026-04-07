import Link from "next/link";
import { db } from "@/lib/db";
import DeleteVideoButton from "./DeleteVideoButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const items = await db.video.findMany();
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Видео</h1>
        <Button asChild>
          <Link href="/dashboard/video/new">
            <Plus className="mr-2 h-4 w-4" /> Қосу
          </Link>
        </Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Видео жоқ.</p>}
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-gray-500 truncate max-w-xs">{item.url}</p>
                <Badge variant={item.published ? "default" : "secondary"}>
                  {item.published ? "Жарияланған" : "Черновик"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/video/${item.id}`}>
                    <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                  </Link>
                </Button>
                <DeleteVideoButton id={item.id} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
