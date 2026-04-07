"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ExerciseItem } from "@/types";

export default function EditExerciseForm({ item }: { item: ExerciseItem }) {
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
    published: !!item.publishedAt,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = form.type === "choice"
      ? { type: form.type, prompt: form.prompt, answer: form.correctOption, correctOption: form.correctOption, optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, explanation: form.explanation, published: form.published }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation, published: form.published };
    const res = await fetch(`/api/exercises/${item.documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Тип</label>
        <select value={form.type} onChange={(e) => set("type", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2">
          <option value="choice">Таңдау (choice)</option>
          <option value="suffix">Жалғау (suffix)</option>
          <option value="fill_blank">Бос толтыру (fill_blank)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Сұрақ</label>
        <textarea value={form.prompt} onChange={(e) => set("prompt", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" required />
      </div>
      {form.type === "choice" ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            {(["A", "B", "C", "D"] as const).map((opt) => (
              <div key={opt}>
                <label className="block text-sm font-medium mb-1">Вариант {opt}</label>
                <input value={form[`option${opt}` as keyof typeof form] as string}
                  onChange={(e) => set(`option${opt}`, e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2" />
              </div>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Дұрыс жауап</label>
            <select value={form.correctOption} onChange={(e) => set("correctOption", e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2">
              <option value="A">A</option><option value="B">B</option>
              <option value="C">C</option><option value="D">D</option>
            </select>
          </div>
        </>
      ) : (
        <div>
          <label className="block text-sm font-medium mb-1">Дұрыс жауап</label>
          <input value={form.answer} onChange={(e) => set("answer", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Түсіндірме</label>
        <textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="pub" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
        <label htmlFor="pub" className="text-sm">Жарияланған</label>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Сақталуда..." : "Сақтау"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
      </div>
    </form>
  );
}
