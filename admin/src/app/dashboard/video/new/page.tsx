"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewVideoPage() {
  const router = useRouter();
  const [form, setForm] = useState({ title: "", url: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/video"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа видео</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Тақырып</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">URL (YouTube сілтемесі)</label>
          <input value={form.url} onChange={(e) => set("url", e.target.value)} type="url"
            className="w-full border border-gray-300 rounded-lg px-3 py-2" required
            placeholder="https://youtube.com/watch?v=..." />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Сипаттама</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" />
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
