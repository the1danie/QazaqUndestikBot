"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RichEditor from "@/components/RichEditor";
import DocxUploadButton from "@/components/DocxUploadButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TheoryItem, TopicItem } from "@/types";

export default function EditErezheForm({ item, topics }: { item: TheoryItem; topics: TopicItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [content, setContent] = useState(item.content);
  const [published, setPublished] = useState(item.published);
  const [topicId, setTopicId] = useState(item.topicId ? String(item.topicId) : "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

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
    const res = await fetch(`/api/erezhe/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        published,
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
        {imageUrl && (
          <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => setImageUrl("")}>
            Суретті жою
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="pub" checked={published} onCheckedChange={(v) => setPublished(!!v)} />
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
