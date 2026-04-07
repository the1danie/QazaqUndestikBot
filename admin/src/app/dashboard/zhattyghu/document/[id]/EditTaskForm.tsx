"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TaskItem, TopicItem } from "@/types";

export default function EditTaskForm({ item, topics }: { item: TaskItem; topics: TopicItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [published, setPublished] = useState(item.published);
  const [topicId, setTopicId] = useState<string>(item.topicId ? String(item.topicId) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/tasks/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, published, topicId: topicId ? Number(topicId) : null }),
    });
    if (res.ok) {
      router.push("/dashboard/zhattyghu");
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
        <Label>Тақырып</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>Мазмұн</Label>
        <RichEditor value={content} onChange={setContent} />
      </div>
      <div className="space-y-1">
        <Label>Тақырып (тема)</Label>
        <Select value={topicId} onValueChange={(v) => setTopicId(v && v !== "none" ? v : "")}>
          <SelectTrigger><SelectValue placeholder="— таңдалмаған —" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— таңдалмаған —</SelectItem>
            {topics.map((t) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="pub" checked={published} onCheckedChange={(v) => setPublished(!!v)} />
        <Label htmlFor="pub">Жарияланған</Label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Сақтау"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
      </div>
    </form>
  );
}
