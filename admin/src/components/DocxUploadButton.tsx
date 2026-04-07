"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";

export default function DocxUploadButton({ onText }: { onText: (text: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/parse-docx", { method: "POST", body: form });
    const data = (await res.json()) as { text?: string; error?: string };

    if (data.text) onText(data.text);
    setLoading(false);

    // reset so same file can be re-uploaded
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".docx"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
        ) : (
          <FileText className="mr-1.5 h-3.5 w-3.5" />
        )}
        {loading ? "Жүктелуде..." : ".docx жүктеу"}
      </Button>
    </>
  );
}
