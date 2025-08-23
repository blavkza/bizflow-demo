import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./OverviewTab";
import { PaymentsTab } from "./PaymentsTab";
import { InvoicesTab } from "./InvoicesTab";
import { DocumentsTab } from "./DocumentsTab";
import { ClientWithRelations } from "./types";

export interface TabsSectionProps {
  client: ClientWithRelations;
}

export default function TabsSection({ client }: TabsSectionProps) {
  return (
    <div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab client={client} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab client={client} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesTab client={client} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
