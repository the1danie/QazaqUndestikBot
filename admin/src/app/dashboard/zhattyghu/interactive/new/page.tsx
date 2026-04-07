"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewExercisePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    type: "choice" as "suffix" | "choice" | "fill_blank",
    prompt: "",
    answer: "",
    correctOption: "A" as "A" | "B" | "C" | "D",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    explanation: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = form.type === "choice"
      ? { type: form.type, prompt: form.prompt, answer: form.correctOption, correctOption: form.correctOption, optionA: form.optionA, optionB: form.optionB, optionC: form.optionC, optionD: form.optionD, explanation: form.explanation }
      : { type: form.type, prompt: form.prompt, answer: form.answer, explanation: form.explanation };
    const res = await fetch("/api/exercises", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) { router.push("/dashboard/zhattyghu"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа интерактивті жаттығу</h1>
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Дұрыс жауап</label>
              <select value={form.correctOption} onChange={(e) => set("correctOption", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2">
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
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
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {saving ? "Сақталуда..." : "Жарияла"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
        </div>
      </form>
    </div>
  );
}
