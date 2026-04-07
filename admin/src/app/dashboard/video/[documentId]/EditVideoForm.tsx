"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { VideoItem } from "@/types";

export default function EditVideoForm({ item }: { item: VideoItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: item.title, url: item.url, description: item.description ?? "", published: !!item.publishedAt,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, value: string | boolean) { setForm((f) => ({ ...f, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/videos/${item.documentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { router.push("/dashboard/video"); router.refresh(); }
    else { const d = await res.json() as { error: string }; setError(d.error); setSaving(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Тақырып</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">URL</label>
        <input value={form.url} onChange={(e) => set("url", e.target.value)} type="url"
          className="w-full border border-gray-300 rounded-lg px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Сипаттама</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24" />
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
