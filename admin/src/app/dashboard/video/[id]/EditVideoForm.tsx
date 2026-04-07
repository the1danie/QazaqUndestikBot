"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { VideoItem } from "@/types";

export default function EditVideoForm({ item }: { item: VideoItem }) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: item.title,
    url: item.url,
    description: item.description ?? "",
    published: item.published,
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
    const res = await fetch(`/api/videos/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push("/dashboard/video");
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
        <Label>Тақырып</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} required />
      </div>
      <div className="space-y-1">
        <Label>URL</Label>
        <Input
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          type="url"
          required
        />
      </div>
      <div className="space-y-1">
        <Label>Сипаттама</Label>
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          className="h-24"
        />
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
