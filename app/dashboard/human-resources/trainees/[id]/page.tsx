"use client";

import axios from "axios";
import Header from "./_components/Header";
import StatsCard from "./_components/Stats-Card";
import TabsSection from "./_components/TabsSection";
import { User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { UserPermission, UserRole } from "@prisma/client";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import Loading from "./_components/loading";
import { TraineeWithDetails } from "../type";

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

export default function TraineeDetailPage() {
  const { id } = useParams() as { id: string };

  const [trainee, setTrainee] = useState<TraineeWithDetails | null>(null);
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

  const canViewTrainees = data?.permissions?.includes(
    UserPermission.Trainee_VIEW,
  );

  const canEditTrainees = data?.permissions?.includes(
    UserPermission.Trainee_EDIT,
  );

  useEffect(() => {
    if (!isLoading && canViewTrainees === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewTrainees, hasFullAccess, router]);

  const fetchTrainee = async () => {
    try {
      const response = await axios.get(`/api/trainees/${id}`);
      setTrainee(response.data);
      // I should double check get route return.
    } catch (err) {
      console.error("Failed to fetch trainee", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainee();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!trainee) {
    return (
      <div className="flex items-center justify-center h-[100vh]">
        Trainee not found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        trainee={trainee}
        canEditTrainees={canEditTrainees}
        hasFullAccess={hasFullAccess}
        fetchTrainee={fetchTrainee}
      />
      <StatsCard trainee={trainee} />
      <TabsSection
        trainee={trainee}
        canEditTrainees={canEditTrainees}
        hasFullAccess={hasFullAccess}
        fetchTrainee={fetchTrainee}
      />
    </div>
  );
}
