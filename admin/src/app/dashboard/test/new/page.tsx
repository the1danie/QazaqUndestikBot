"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewTestPage() {
  const router = useRouter();
  const [form, setForm] = useState({ question: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A", explanation: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/test-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/test"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа тест сұрақ</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Сұрақ</label>
          <textarea value={form.question} onChange={(e) => set("question", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(["A", "B", "C", "D"] as const).map((opt) => (
            <div key={opt}>
              <label className="block text-sm font-medium mb-1">Вариант {opt}</label>
              <input value={form[`option${opt}` as keyof typeof form]}
                onChange={(e) => set(`option${opt}`, e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
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
        <div>
          <label className="block text-sm font-medium mb-1">Түсіндірме</label>
          <textarea value={form.explanation} onChange={(e) => set("explanation", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20" />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Сақталуда..." : "Жарияла"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 rounded-lg">Болдырмау</button>
        </div>
      </form>
    </div>
  );
}
