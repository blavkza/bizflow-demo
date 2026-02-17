"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { UserPermission, UserRole } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import TrainersPageWrapper from "./_components/TrainersPageWrapper"; // Renamed
import TrainersLoading from "./_components/loading";

interface Trainer {
  id: string;
  trainerNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  salary: number;
  address: string;
  hireDate: string;
  reliable: boolean;
  avatar: string | null;
}

interface Department {
  id: string;
  name: string;
}

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

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
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

  const canViewTrainers = data?.permissions?.includes(
    UserPermission.Trainer_VIEW,
  );

  const canCreateTrainers = data?.permissions?.includes(
    UserPermission.Trainer_CREATE,
  );

  useEffect(() => {
    if (!isLoading && canViewTrainers === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewTrainers, hasFullAccess, router]);

  const fetchTrainers = async () => {
    try {
      const response = await axios.get("/api/trainers");
      setTrainers(response.data.trainers || []);
      setDepartments(response.data.departments || []);
      setStatuses(response.data.statuses || []);
    } catch (err) {
      setError("Failed to fetch trainers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <TrainersLoading />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-6 text-red-500">{error}</div>;
  }

  return (
    <TrainersPageWrapper
      trainers={trainers}
      departments={departments}
      initialStatuses={statuses}
      fetchTrainers={fetchTrainers}
      canCreateTrainers={canCreateTrainers}
      canViewTrainers={canViewTrainers}
      hasFullAccess={hasFullAccess}
    />
  );
}
