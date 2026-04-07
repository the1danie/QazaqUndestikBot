"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteTopicButton({ id }: { id: number }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Тақырыпты жою керек пе? Байланысқан элементтер тақырыпсыз қалады.")) return;
    await fetch(`/api/topics/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
