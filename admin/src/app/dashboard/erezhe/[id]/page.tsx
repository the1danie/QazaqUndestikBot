import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EditErezheForm from "./EditErezheForm";

export const dynamic = "force-dynamic";

export default async function EditErezhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.theory.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Ережені өңдеу</h1>
      <EditErezheForm item={item} />
    </div>
  );
}
