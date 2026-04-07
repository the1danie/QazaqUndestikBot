import { strapiGetOne } from "@/lib/strapi";
import type { VideoItem } from "@/types";
import EditVideoForm from "./EditVideoForm";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<VideoItem>("videos", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Видеоны өңдеу</h1>
      <EditVideoForm item={item} />
    </div>
  );
}
