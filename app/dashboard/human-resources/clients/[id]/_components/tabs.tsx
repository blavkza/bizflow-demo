"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OverviewTab } from "./OverviewTab";
import { PaymentsTab } from "./PaymentsTab";
import { InvoicesTab } from "./InvoicesTab";
import { DocumentsTab } from "./DocumentsTab";

import { Client } from "@prisma/client";

export interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  createdAt: Date;
}

export interface Invoice {
  id: string;
  number: string;
  totalAmount: number;
  status: string;
  issueDate: Date;
  dueDate: Date;
  payments: {
    id: string;
    amount: number;
    method: string;
    description: string;
    paidAt: Date | null;
  }[];
}

export interface TabsSectionProps {
  client: Client & {
    invoices?: Invoice[];
    documents?: Document[];
  };
}

export default function TabsSection({ client }: TabsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>(
    client.documents || []
  );
  const [invoices, setInvoices] = useState<Invoice[]>(client.invoices || []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?clientId=${client.id}`);
      if (!response.ok) throw new Error("Failed to fetch documents");
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`/api/invoices?clientId=${client.id}`);
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      setInvoices(data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchInvoices();
  }, [client.id]);

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
          <OverviewTab client={{ ...client, invoices, documents }} />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentsTab
            client={{ ...client, invoices }}
            fetchInvoices={fetchInvoices}
          />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoicesTab
            client={{ ...client, invoices }}
            fetchInvoices={fetchInvoices}
          />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab
            client={{ ...client, documents }}
            fetchDocuments={fetchDocuments}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
