"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Header from "./_components/header";
import StatsCard from "./_components/stats-card";
import ClientListWrapper from "./_components/client-list-wrapper";
import { Client } from "@/types/client";
import ClientsLoading from "./_components/loading";
import { UserPermission, UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { userId } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];

  const hasFullAccess = data?.role
    ? hasRole(data?.role, fullAccessRoles)
    : false;

  const canViewClients = data?.permissions?.includes(
    UserPermission.Clients_VIEW
  );

  const canCreateClient = data?.permissions?.includes(
    UserPermission.Clients_CREATE
  );

  useEffect(() => {
    if (!isLoading && canViewClients === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewClients, hasFullAccess]);

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

  useEffect(() => {
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
      <Header
        fetchClients={fetchClients}
        canCreateClient={canCreateClient}
        hasFullAccess={hasFullAccess}
      />
      <StatsCard clients={clients} />
      <ClientListWrapper clients={clients} />
    </div>
  );
}
