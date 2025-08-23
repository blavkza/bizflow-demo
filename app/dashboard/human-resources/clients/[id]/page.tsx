"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Header from "./_components/header";
import StatsCard from "./_components/stats-card";
import TabsSection from "./_components/tabs";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { ClientWithRelations } from "./_components/types";
import { toast } from "sonner";
import Loading from "./_components/Loading";
import { useRouter } from "next/navigation";

export default function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [client, setClient] = useState<ClientWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

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
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Client Header */}
      <Header client={client} fetchClient={fetchClient} />

      {/* Key Metrics */}
      <StatsCard client={client} />

      {/* Tabs */}
      <TabsSection client={client} />
    </div>
  );
}
