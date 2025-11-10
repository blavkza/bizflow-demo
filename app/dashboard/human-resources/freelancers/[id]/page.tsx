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

interface FreelancerWithDetails {
  id: string;
  freelancerNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  position: string;
  department?: {
    id: string;
    name: string;
    manager?: {
      name: string;
    } | null;
  } | null;
  status: string;
  salary: number;
  address: string;
  hireDate: string;
  reliable: boolean;
  avatar?: string;
  scheduledKnockIn?: string;
  scheduledKnockOut?: string;
  workingDays?: string[];
  // Personal info fields
  idNumber?: string;
  taxNumber?: string;
  nationality?: string;
  maritalStatus?: string;
  bankName?: string;
  accountNumber?: string;
  branchCode?: string;
  accountType?: string;
  // Contact info fields
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  emergencyAddress?: string;
  // Payments
  payments?: any[];
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

export default function FreelancerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [freelancer, setFreelancer] = useState<FreelancerWithDetails | null>(
    null
  );
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

  const canViewFreelancers = data?.permissions?.includes(
    UserPermission.EMPLOYEES_VIEW
  );

  const canEditFreelancers = data?.permissions?.includes(
    UserPermission.EMPLOYEES_EDIT
  );

  useEffect(() => {
    if (!isLoading && canViewFreelancers === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewFreelancers, hasFullAccess]);

  const fetchFreelancer = async () => {
    try {
      const response = await axios.get(`/api/freelancers/${id}`);
      setFreelancer(response.data);
    } catch (err) {
      console.error("Failed to fetch freelancer", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFreelancer();
  }, [id]);

  if (loading) {
    return <Loading />;
  }

  if (!freelancer) {
    return (
      <div className="flex items-center justify-center h-[100vh]">
        Freelancer not found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Header
        freelancer={freelancer}
        canEditFreelancers={canEditFreelancers}
        hasFullAccess={hasFullAccess}
        fetchFreelancer={fetchFreelancer}
      />
      <StatsCard freelancer={freelancer} />
      <TabsSection
        freelancer={freelancer}
        canEditFreelancers={canEditFreelancers}
        hasFullAccess={hasFullAccess}
        fetchFreelancer={fetchFreelancer}
      />
    </div>
  );
}
