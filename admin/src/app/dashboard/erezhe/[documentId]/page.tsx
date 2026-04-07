import EditErezheForm from "./EditErezheForm";
import { strapiGetOne } from "@/lib/strapi";
import type { TheoryItem } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditErezhePage({ params }: { params: Promise<{ documentId: string }> }) {
  const { documentId } = await params;
  const item = await strapiGetOne<TheoryItem>("theories", documentId);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Ережені өңдеу</h1>
      <EditErezheForm item={item} />
    </div>
  );
}
