"use client";

import { Button } from "@/components/ui/button";
import Header from "./_components/header";
import StatsCard from "./_components/stats-card";
import TabsSection from "./_components/tabs";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { ClientWithRelations } from "./_components/types";
import { toast } from "sonner";
import Loading from "./_components/Loading";
import { useRouter } from "next/navigation";
import { UserPermission, UserRole } from "@prisma/client";
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

export default function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [client, setClient] = useState<ClientWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

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

  const canEditClient = data?.permissions?.includes(
    UserPermission.Clients_EDIT
  );

  const canCreateTransation = data?.permissions?.includes(
    UserPermission.TRANSACTIONS_MANAGE
  );

  useEffect(() => {
    if (!isLoading && canViewClients === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewClients, hasFullAccess]);

  const fetchClient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clients/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch client");
      }

      const data = await response.json();

      setClient(data);
    } catch (err) {
      toast.error("Failed to fetch client");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchClient();
    }
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!client) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        No client found
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center space-x-4"></div>

      <Header
        client={client}
        fetchClient={fetchClient}
        canEditClient={canEditClient}
        hasFullAccess={hasFullAccess}
      />

      <StatsCard client={client} />

      <TabsSection
        client={client}
        fetchClient={fetchClient}
        canEditClient={canEditClient}
        canCreateTransation={canCreateTransation}
        hasFullAccess={hasFullAccess}
      />
    </div>
  );
}
