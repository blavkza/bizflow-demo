"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";
import { Department } from "@/types/department";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useRouter } from "next/navigation";
import DepartmentForm from "../../_components/department-Form";

interface DepartmentHeaderProps {
  department: Department;
  fetchDepartment: () => void;
  canEditDepartments: boolean;
  hasFullAccess: boolean;
}

export default function DepartmentHeader({
  department,
  fetchDepartment,
  canEditDepartments,
  hasFullAccess,
}: DepartmentHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();

  const formData = {
    id: department.id,
    name: department.name ?? undefined,
    description: department.description ?? undefined,
    managerId: department.manager?.id ?? undefined,
    location: department.location ?? undefined,
    floor: department.floor ?? undefined,
    building: department.building ?? undefined,
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        {" "}
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/dashboard/human-resources/departments")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{department.name}</h1>
        <Badge
          variant="outline"
          className={`ml-2 ${
            department.status === "ACTIVE"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {department.status.toLowerCase()}
        </Badge>
      </div>
      {(canEditDepartments || hasFullAccess) && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Department
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-2xl">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl">Edit Department</DialogTitle>
              <DialogDescription className="text-base">
                Update department information below.
              </DialogDescription>
            </DialogHeader>
            <DepartmentForm
              type="update"
              data={formData}
              onCancel={() => setIsOpen(false)}
              onSubmitSuccess={() => {
                setIsOpen(false);
                fetchDepartment();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
