"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TopicItem } from "@/types";

export default function EditTopicForm({ item }: { item: TopicItem }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/topics/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      router.push("/dashboard/topics");
      router.refresh();
    } else {
      const d = (await res.json()) as { error: string };
      setError(d.error);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Атауы</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Сақтау"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
      </div>
    </form>
  );
}
