"use client";

import axios from "axios";
import Header from "./_components/Header";
import StatsCard from "./_components/Stats-Card";
import TabsSection from "./_components/TabsSection";
import { use, useEffect, useState } from "react";
import { UserPermission, UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Loading from "./_components/loading";
import { TrainerWithDetails } from "../type";

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

export default function TrainerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [trainer, setTrainer] = useState<TrainerWithDetails | null>(null);
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

  const canViewTrainers = data?.permissions?.includes(
    UserPermission.Trainer_VIEW,
  );

  const canEditTrainers = data?.permissions?.includes(
    UserPermission.Trainer_EDIT,
  );

  useEffect(() => {
    if (!isLoading && canViewTrainers === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewTrainers, hasFullAccess, router]);

  const fetchTrainer = async () => {
    try {
      const response = await axios.get(`/api/trainers/${id}`);
      setTrainer(response.data.trainer); // response structure might be { trainer: ... } based on typical API I write.
      // I should double check get route return.
    } catch (err) {
      console.error("Failed to fetch trainer", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainer();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!trainer) {
    return (
      <div className="flex items-center justify-center h-[100vh]">
        Trainer not found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        trainer={trainer}
        canEditTrainers={canEditTrainers}
        hasFullAccess={hasFullAccess}
        fetchTrainer={fetchTrainer}
      />
      <StatsCard trainer={trainer} />
      <TabsSection
        trainer={trainer}
        canEditTrainers={canEditTrainers}
        hasFullAccess={hasFullAccess}
        fetchTrainer={fetchTrainer}
      />
    </div>
  );
}
