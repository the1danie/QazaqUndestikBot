"use client";
import { useRouter } from "next/navigation";

export default function DeleteVideoButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  async function handleDelete() {
    if (!confirm("Жою керек пе?")) return;
    await fetch(`/api/videos/${documentId}`, { method: "DELETE" });
    router.refresh();
  }
  return <button onClick={handleDelete} className="text-sm text-red-500 hover:underline">Жою</button>;
}
