import Link from "next/link";
import { strapiList } from "@/lib/strapi";
import type { VideoItem } from "@/types";
import DeleteVideoButton from "./DeleteVideoButton";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const items = await strapiList<VideoItem>("videos");
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Видео</h1>
        <Link href="/dashboard/video/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">+ Қосу</Link>
      </div>
      <div className="space-y-3">
        {items.length === 0 && <p className="text-gray-500">Видео жоқ.</p>}
        {items.map((item) => (
          <div key={item.documentId} className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-gray-500 truncate max-w-xs">{item.url}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.publishedAt ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                {item.publishedAt ? "Жарияланған" : "Черновик"}
              </span>
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/video/${item.documentId}`}
                className="text-sm text-blue-600 hover:underline">Өңдеу</Link>
              <DeleteVideoButton documentId={item.documentId} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
