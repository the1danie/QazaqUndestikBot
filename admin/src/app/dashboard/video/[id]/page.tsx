import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditVideoForm from "./EditVideoForm";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.video.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Видеоны өңдеу</h1>
      <EditVideoForm item={item} />
    </div>
  );
}
