"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Employee } from "@prisma/client";
import { DollarSign } from "lucide-react";
import { Label } from "@/components/ui/label";
import PayrollForm from "../../_components/Payroll-Form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EmployeePaymentForm } from "./EmployeePaymentForm ";

interface WorkerProfileProps {
  employee: Employee & {
    department?: {
      id: string;
      name: string;
      manager?: {
        name: string;
      } | null;
    } | null;
    payments?: {
      id: string;
      amount: number;
      payDate: Date;
      type: string;
      status: string;
      description?: string | null;
    }[];
  };
}

export default function WorkerProfile({ employee }: WorkerProfileProps) {
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const router = useRouter();

  const name = `${employee.firstName} ${employee.lastName}`;

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={employee.avatar || "/placeholder.svg"}
                alt={name}
              />
              <AvatarFallback>
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-2xl">{name}</CardTitle>
              <CardDescription className="text-lg">
                {employee.position}
              </CardDescription>
              <Badge
                variant={employee.status === "ACTIVE" ? "default" : "secondary"}
                className="mt-2"
              >
                {employee.status}
              </Badge>
            </div>
            <Dialog
              open={isPayrollDialogOpen}
              onOpenChange={setIsPayrollDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Process Payroll</DialogTitle>
                  <DialogDescription>
                    Process payment for {name}
                  </DialogDescription>
                </DialogHeader>
                <EmployeePaymentForm
                  employee={employee}
                  onCancel={() => setIsPayrollDialogOpen(false)}
                  onSubmitSuccess={() => {
                    setIsPayrollDialogOpen(false);
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
