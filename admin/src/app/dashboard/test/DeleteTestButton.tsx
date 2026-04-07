"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function DeleteTestButton({ id }: { id: number }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/test-questions/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <Button variant="destructive" size="sm" onClick={handleDelete}>
      <Trash2 className="mr-1 h-3 w-3" /> Жою
    </Button>
  );
}
