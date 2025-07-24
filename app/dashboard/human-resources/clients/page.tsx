"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Header from "./_components/header";
import StatsCard from "./_components/stats-card";
import ClientListWrapper from "./_components/client-list-wrapper";
import { Client } from "@/types/client";
import ClientsLoading from "./_components/loading";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await axios.get("/api/clients/all-clients");
        const data = response.data.map((client: any) => ({
          ...client,
          createdAt: new Date(client.createdAt),
          updatedAt: new Date(client.updatedAt),
          invoices: client.invoices?.map((invoice: any) => ({
            ...invoice,
            issueDate: new Date(invoice.issueDate),
            payments: invoice.payments.map((payment: any) => ({
              ...payment,
              paidAt: payment.paidAt ? new Date(payment.paidAt) : null,
            })),
          })),
        }));
        setClients(data);
      } catch (err) {
        setError("Failed to fetch clients");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (loading)
    return (
      <div>
        <ClientsLoading />
      </div>
    );

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Header />
      <StatsCard clients={clients} />
      <ClientListWrapper clients={clients} />
    </div>
  );
}
