import { ToolRequestDetailClient } from "./_components/tool-request-detail-client";

export default async function ToolRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  return <ToolRequestDetailClient requestId={requestId} />;
}
