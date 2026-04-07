"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface RichEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function RichEditor({ value, onChange }: RichEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="flex gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-wrap">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("bold") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          <b>B</b>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("italic") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          <i>I</i>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("bulletList") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          • Тізім
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("orderedList") ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          1. Тізім
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive("heading", { level: 2 }) ? "bg-gray-300" : "hover:bg-gray-200"}`}>
          H2
        </button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[200px] focus:outline-none" />
    </div>
  );
}
