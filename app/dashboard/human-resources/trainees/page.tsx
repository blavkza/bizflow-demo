"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { UserPermission, UserRole } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import TraineesPageWrapper from "./_components/TraineesPageWrapper"; // Renamed
import TraineesLoading from "./_components/loading";

interface Trainee {
  id: string;
  traineeId: string;
  traineeNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  position: string;
  department: string;
  status: string;
  salary: number;
  location: string;
  startDate: string;
  reliable: boolean;
  avatar: string | null;
  manager?: string;
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

export default function TraineesPage() {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
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

  const canViewTrainees = data?.permissions?.includes(
    UserPermission.Trainee_VIEW,
  );

  const canCreateTrainees = data?.permissions?.includes(
    UserPermission.Trainee_CREATE,
  );

  useEffect(() => {
    if (!isLoading && canViewTrainees === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewTrainees, hasFullAccess, router]);

  const fetchTrainees = async () => {
    try {
      const response = await axios.get("/api/trainees");
      setTrainees(response.data.trainees || []);
      setDepartments(response.data.departments || []);
      setStatuses(response.data.statuses || []);
    } catch (err) {
      setError("Failed to fetch trainees");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainees();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <TraineesLoading />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-6 text-red-500">{error}</div>;
  }

  return (
    <TraineesPageWrapper
      trainees={trainees}
      departments={departments}
      initialStatuses={statuses}
      fetchTrainees={fetchTrainees}
      canCreateTrainees={canCreateTrainees}
      canViewTrainees={canViewTrainees}
      hasFullAccess={hasFullAccess}
    />
  );
}
