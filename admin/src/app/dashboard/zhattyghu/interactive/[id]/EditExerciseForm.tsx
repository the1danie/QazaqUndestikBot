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
import type { ExerciseItem, TopicItem } from "@/types";

export default function EditExerciseForm({ item, topics }: { item: ExerciseItem; topics: TopicItem[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    type: item.type,
    prompt: item.prompt,
    answer: item.answer,
    correctOption: item.correctOption ?? "A",
    optionA: item.optionA ?? "",
    optionB: item.optionB ?? "",
    optionC: item.optionC ?? "",
    optionD: item.optionD ?? "",
    explanation: item.explanation ?? "",
    imageUrl: item.imageUrl ?? "",
    published: item.published,
  });
  const [topicId, setTopicId] = useState<string>(item.topicId ? String(item.topicId) : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = (await res.json()) as { url: string };
      set("imageUrl", url);
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload =
      form.type === "choice"
        ? { ...form, answer: form.correctOption, topicId: topicId ? Number(topicId) : null }
        : {
            type: form.type,
            prompt: form.prompt,
            answer: form.answer,
            explanation: form.explanation,
            imageUrl: form.imageUrl,
            published: form.published,
            topicId: topicId ? Number(topicId) : null,
          };
    const res = await fetch(`/api/exercises/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
        <Label>Тип</Label>
        <Select value={form.type} onValueChange={(v) => set("type", v ?? "choice")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="choice">Таңдау (choice)</SelectItem>
            <SelectItem value="suffix">Жалғау (suffix)</SelectItem>
            <SelectItem value="fill_blank">Бос толтыру (fill_blank)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Сұрақ</Label>
        <Textarea
          value={form.prompt}
          onChange={(e) => set("prompt", e.target.value)}
          className="h-24"
          required
        />
      </div>
      {form.type === "choice" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {(["A", "B", "C", "D"] as const).map((opt) => (
              <div key={opt} className="space-y-1">
                <Label>Вариант {opt}</Label>
                <Input
                  value={form[`option${opt}` as keyof typeof form] as string}
                  onChange={(e) => set(`option${opt}`, e.target.value)}
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
        </>
      ) : (
        <div className="space-y-1">
          <Label>Дұрыс жауап</Label>
          <Input
            value={form.answer}
            onChange={(e) => set("answer", e.target.value)}
            required
          />
        </div>
      )}
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
      <div className="space-y-1">
        <Label>Сурет</Label>
        <Input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          disabled={uploading}
        />
        {uploading && <p className="text-sm text-gray-500">Жүктелуде...</p>}
        {form.imageUrl && (
          <img src={form.imageUrl} alt="preview" className="mt-2 max-h-40 rounded" />
        )}
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
