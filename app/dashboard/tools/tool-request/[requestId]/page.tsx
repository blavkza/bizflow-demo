import { ToolRequestDetailClient } from "./_components/tool-request-detail-client";

export default function ToolRequestDetailPage({
  params,
}: {
  params: { requestId: string };
}) {
  return <ToolRequestDetailClient requestId={params.requestId} />;
}
