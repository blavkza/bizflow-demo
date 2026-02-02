import { ToolDetailClient } from "./_components/tool-detail-client";

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ToolDetailClient toolId={id} />;
}
