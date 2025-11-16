import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import FolderPage from "./_components/Folder-Page";
import Loading from "./_components/FolderPageSkeleton";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Loading />}>
      <FolderPageWrapper params={params} />
    </Suspense>
  );
}

async function FolderPageWrapper({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FolderPage folderId={id} />;
}
