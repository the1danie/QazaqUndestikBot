"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewErezhePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/erezhe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });
    if (res.ok) {
      router.push("/dashboard/erezhe");
      router.refresh();
    } else {
      const d = (await res.json()) as { error: string };
      setError(d.error);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Жаңа ереже</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <Label>Тақырып</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <Label>Мазмұн</Label>
          <RichEditor value={content} onChange={setContent} />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Сақталуда..." : "Жарияла"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Болдырмау
          </Button>
        </div>
      </form>
    </div>
  );
}
