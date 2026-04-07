"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TopicItem } from "@/types";

export default function NewTaskPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState("");
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/topics").then((r) => r.json()).then((data) => setTopics(data as TopicItem[]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, topicId: topicId ? Number(topicId) : null }),
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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа тапсырма (документ)</h1>
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
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Жарияла"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
        </div>
      </form>
    </div>
  );
}
