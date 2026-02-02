import { format } from "date-fns";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { WorkerToolsClient } from "./_components/worker-tools-client";

export default function WorkerToolsPage() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Heading
          title="Worker Tools"
          description="Manage and track tools allocated to employees and freelancers"
        />
        <Separator />
        <WorkerToolsClient />
      </div>
    </div>
  );
}
