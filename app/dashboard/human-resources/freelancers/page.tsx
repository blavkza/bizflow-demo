"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import { UserPermission, UserRole } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import FreelancersPageWrapper from "./_components/FreelancersPageWrapper";
import FreelancersLoading from "./_components/loading";

interface Freelancer {
  id: string;
  freelancerNumber: string;
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

export default function FreelancersPage() {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
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

  const canViewFreelancers = data?.permissions?.includes(
    UserPermission.Freelancer_VIEW
  );

  const canCreateFreelancers = data?.permissions?.includes(
    UserPermission.EMPLOYEES_CREATE
  );

  useEffect(() => {
    if (!isLoading && canViewFreelancers === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewFreelancers, hasFullAccess, router]);

  const fetchFreelancers = async () => {
    try {
      const response = await axios.get("/api/freelancers");
      setFreelancers(response.data.freelancers || []);
      setDepartments(response.data.departments || []);
      setStatuses(response.data.statuses || []);
    } catch (err) {
      setError("Failed to fetch freelancers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <FreelancersLoading />
      </div>
    );
  }

  if (error) {
    return <div className="container mx-auto p-6 text-red-500">{error}</div>;
  }

  console.log(freelancers);

  return (
    <FreelancersPageWrapper
      freelancers={freelancers}
      departments={departments}
      initialStatuses={statuses}
      fetchFreelancers={fetchFreelancers}
      canCreateFreelancers={canCreateFreelancers}
      canViewFreelancers={canViewFreelancers}
      hasFullAccess={hasFullAccess}
    />
  );
}
