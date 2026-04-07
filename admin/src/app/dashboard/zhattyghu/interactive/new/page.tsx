"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function NewExercisePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "choice" as "suffix" | "choice" | "fill_blank",
    prompt: "", answer: "", correctOption: "A" as "A" | "B" | "C" | "D",
    optionA: "", optionB: "", optionC: "", optionD: "", explanation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = form.type === "choice"
      ? { type: form.type, prompt: form.prompt, answer: form.correctOption, correctOption: form.correctOption, optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, explanation: form.explanation }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation };
    const res = await fetch("/api/exercises", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа интерактивті жаттығу</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Тип</Label>
          <Select value={form.type} onValueChange={(v) => set("type", v)}>
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
                    onChange={(e) => set(`option${opt}`, e.target.value)} required />
                </div>
              ))}
            </div>
            <div className="space-y-1">
              <Label>Дұрыс жауап</Label>
              <Select value={form.correctOption} onValueChange={(v) => set("correctOption", v)}>
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
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? "Сақталуда..." : "Жарияла"}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Болдырмау</Button>
        </div>
      </form>
    </div>
  );
}
