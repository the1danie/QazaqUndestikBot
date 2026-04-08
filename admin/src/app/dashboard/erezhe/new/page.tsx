"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import DocxUploadButton from "@/components/DocxUploadButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TopicItem } from "@/types";

export default function NewErezhePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [topicId, setTopicId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/topics").then((r) => r.json()).then((data) => setTopics(data as TopicItem[]));
  }, []);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (res.ok) {
      const { url } = (await res.json()) as { url: string };
      setImageUrl(url);
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/erezhe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        imageUrl: imageUrl || null,
        topicId: topicId ? Number(topicId) : null,
      }),
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
          <Label>Атауы</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
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
          <div className="flex items-center justify-between">
            <Label>Мазмұн</Label>
            <DocxUploadButton onText={setContent} />
          </div>
          <RichEditor value={content} onChange={setContent} />
        </div>
        <div className="space-y-1">
          <Label>Сурет</Label>
          <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          {uploading && <p className="text-sm text-gray-500">Жүктелуде...</p>}
          {imageUrl && (
            <img src={imageUrl} alt="preview" className="mt-2 max-h-40 rounded" />
          )}
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
