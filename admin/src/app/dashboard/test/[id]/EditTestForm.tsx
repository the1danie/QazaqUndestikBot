"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TestQuestionItem, TopicItem } from "@/types";

export default function EditTestForm({ item, topics }: { item: TestQuestionItem; topics: TopicItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    question: item.question,
    optionA: item.optionA,
    optionB: item.optionB,
    optionC: item.optionC,
    optionD: item.optionD,
    correctOption: item.correctOption ?? "A",
    explanation: item.explanation ?? "",
    published: item.published,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [topicId, setTopicId] = useState<string>(item.topicId ? String(item.topicId) : "");

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/test-questions/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, topicId: topicId ? Number(topicId) : null }),
    });
    if (res.ok) {
      router.push("/dashboard/test");
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
        <Label>Сұрақ</Label>
        <Textarea
          value={form.question}
          onChange={(e) => set("question", e.target.value)}
          className="h-24"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["A", "B", "C", "D"] as const).map((opt) => (
          <div key={opt} className="space-y-1">
            <Label>Вариант {opt}</Label>
            <Input
              value={form[`option${opt}` as keyof typeof form] as string}
              onChange={(e) => set(`option${opt}`, e.target.value)}
              required
            />
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Label>Дұрыс жауап</Label>
        <Select
          value={form.correctOption}
          onValueChange={(v) => set("correctOption", v ?? "A")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["A", "B", "C", "D"] as const).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Түсіндірме</Label>
        <Textarea
          value={form.explanation}
          onChange={(e) => set("explanation", e.target.value)}
          className="h-20"
        />
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
        <Checkbox
          id="pub"
          checked={form.published}
          onCheckedChange={(v) => set("published", !!v)}
        />
        <Label htmlFor="pub">Жарияланған</Label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Сақталуда..." : "Сақтау"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Болдырмау
        </Button>
      </div>
    </form>
  );
}
