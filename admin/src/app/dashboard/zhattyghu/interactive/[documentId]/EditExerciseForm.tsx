"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ExerciseItem } from "@/types";

export default function EditExerciseForm({ item }: { item: ExerciseItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    type: item.type, prompt: item.prompt, answer: item.answer,
    correctOption: item.correctOption ?? "A",
    optionA: item.optionA ?? "", optionB: item.optionB ?? "",
    optionC: item.optionC ?? "", optionD: item.optionD ?? "",
    explanation: item.explanation ?? "", published: !!item.publishedAt,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = form.type === "choice"
      ? { type: form.type, prompt: form.prompt, answer: form.correctOption, correctOption: form.correctOption, optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, explanation: form.explanation, published: form.published }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation, published: form.published };
    const res = await fetch(`/api/exercises/${item.documentId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label>Тип</Label>
        <Select value={form.type} onValueChange={(v) => set("type", v ?? form.type)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="choice">Таңдау (choice)</SelectItem>
            <SelectItem value="suffix">Жалғау (suffix)</SelectItem>
            <SelectItem value="fill_blank">Бос толтыру (fill_blank)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Сұрақ</Label>
        <Textarea value={form.prompt} onChange={(e) => set("prompt", e.target.value)} className="h-24" required />
      </div>
      {form.type === "choice" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {(["A", "B", "C", "D"] as const).map((opt) => (
              <div key={opt} className="space-y-1">
                <Label>Вариант {opt}</Label>
                <Input value={form[`option${opt}` as keyof typeof form] as string}
                  onChange={(e) => set(`option${opt}`, e.target.value)} />
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
        </>
      ) : (
        <div className="space-y-1">
          <Label>Дұрыс жауап</Label>
          <Input value={form.answer} onChange={(e) => set("answer", e.target.value)} required />
        </div>
      )}
      <div className="space-y-1">
        <Label>Түсіндірме</Label>
        <Textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} className="h-20" />
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="pub" checked={form.published} onCheckedChange={(v) => set("published", !!v)} />
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
