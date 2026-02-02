"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Plus, Building2, Users, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserRole, UserPermission } from "@prisma/client";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { columns, LenderColumn } from "./lender-columns";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import LenderStats from "./lender-stats";
import { LenderFilters } from "./lender-filters";
import { LenderModal } from "./lender-modal";
import { useMemo } from "react";
import LendersLoading from "../loading";

const lenderFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactPerson: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  interestRate: z.coerce.number().min(0).optional(),
  termMonths: z.coerce.number().int().min(1).optional(),
});

type LenderFormValues = z.infer<typeof lenderFormSchema>;

export const LenderClient = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("name_asc");

  const { userId: authId } = useAuth();
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["user", authId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/users/userId/${authId}`);
      return data;
    },
    enabled: !!authId,
  });

  const {
    data: lenders,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["lenders"],
    queryFn: async () => {
      const { data } = await axios.get("/api/lenders");
      return data;
    },
  });

  const hasFullAccess =
    userData?.role === UserRole.CHIEF_EXECUTIVE_OFFICER ||
    userData?.role === UserRole.ADMIN_MANAGER;
  const canCreateLenders =
    userData?.permissions?.includes(UserPermission.LENDERS_CREATE) ||
    hasFullAccess;

  const formattedLenders: LenderColumn[] = (lenders || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    contactPerson: item.contactPerson,
    email: item.email,
    phone: item.phone,
    interestRate: item.interestRate,
    termMonths: item.termMonths,
    createdAt: item.createdAt,
  }));

  const filteredLenders = useMemo(() => {
    let result = [...formattedLenders];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(term) ||
          l.contactPerson?.toLowerCase().includes(term) ||
          l.email?.toLowerCase().includes(term),
      );
    }

    if (sortOption === "name_asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortOption === "name_desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortOption === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortOption === "rate_high") {
      result.sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
    } else if (sortOption === "rate_low") {
      result.sort((a, b) => (a.interestRate || 0) - (b.interestRate || 0));
    }

    return result;
  }, [formattedLenders, searchTerm, sortOption]);

  if (isLoading || userLoading) {
    return <LendersLoading />;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          title={`Loan Lenders (${(lenders || []).length})`}
          description="Manage and track your financing partners."
        />
        {canCreateLenders && (
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Lender
          </Button>
        )}
      </div>
      <div className="space-y-6">
        <LenderStats lenders={lenders || []} />

        <LenderFilters
          searchTerm={searchTerm}
          sortOption={sortOption}
          onSearchChange={setSearchTerm}
          onSortOptionChange={setSortOption}
        />

        <Card>
          <CardHeader>
            <CardTitle>Lender Management</CardTitle>
            <CardDescription>
              {filteredLenders.length} lender(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={filteredLenders} />
          </CardContent>
        </Card>
      </div>

      <LenderModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onSuccess={() => refetch()}
      />
    </>
  );
};
