"use client";
import { useRouter } from "next/navigation";

export default function DeleteExerciseButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/exercises/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">Жою</button>;
}
