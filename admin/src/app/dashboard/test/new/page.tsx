"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TopicItem } from "@/types";

export default function NewTestPage() {
  const router = useRouter();
  const [form, setForm] = useState({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", explanation: "" });
  const [topicId, setTopicId] = useState("");
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/topics").then((r) => r.json()).then((data) => setTopics(data as TopicItem[]));
  }, []);

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/test-questions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, topicId: topicId ? Number(topicId) : null }),
    });
    if (res.ok) { router.push("/dashboard/test"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа тест сұрақ</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Сұрақ</Label>
          <Textarea value={form.question} onChange={(e) => set("question", e.target.value)} className="h-24" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["A", "B", "C", "D"] as const).map((opt) => (
            <div key={opt} className="space-y-1">
              <Label>Вариант {opt}</Label>
              <Input value={form[`option${opt}` as keyof typeof form]}
                onChange={(e) => set(`option${opt}`, e.target.value)} required />
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <Label>Дұрыс жауап</Label>
          <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v ?? form.correctOption)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(["A", "B", "C", "D"] as const).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
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
        <div className="space-y-1">
          <Label>Түсіндірме</Label>
          <Textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} className="h-20" />
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
