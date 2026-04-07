import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { TestQuestionItem } from "@/types";
import DeleteTestButton from "./DeleteTestButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const items = await strapiList<TestQuestionItem>("test-questions");
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Тест</h1>
        <Button asChild>
          <Link href="/dashboard/test/new"><Plus className="mr-2 h-4 w-4" /> Қосу</Link>
        </Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Тест жоқ.</p>}
        {items.map((item) => (
          <Card key={item.documentId}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-medium text-sm">{item.question}</p>
                <Badge variant={item.publishedAt ? "default" : "secondary"}>
                  {item.publishedAt ? "Жарияланған" : "Черновик"}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/test/${item.documentId}`}>
                    <Pencil className="mr-1 h-3 w-3" /> Өңдеу
                  </Link>
                </Button>
                <DeleteTestButton documentId={item.documentId} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
