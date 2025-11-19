"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { WorkerWithDetails } from "@/types/payroll";
import { DollarSign, UserCheck, Briefcase } from "lucide-react";
import { WorkerPaymentForm } from "./WorkerPaymentForm";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface WorkerProfileProps {
  worker: WorkerWithDetails;
}

export default function WorkerProfile({ worker }: WorkerProfileProps) {
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const router = useRouter();

  const name = `${worker.firstName} ${worker.lastName}`;
  const workerNumber = worker.isFreelancer
    ? (worker as any).freeLancerNumber
    : (worker as any).employeeNumber;

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={worker.avatar || "/placeholder.svg"}
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
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{name}</CardTitle>
                <Badge
                  variant={worker.isFreelancer ? "secondary" : "outline"}
                  className="flex items-center gap-1"
                >
                  {worker.isFreelancer ? (
                    <Briefcase className="h-3 w-3" />
                  ) : (
                    <UserCheck className="h-3 w-3" />
                  )}
                  {worker.isFreelancer ? "Freelancer" : "Employee"}
                </Badge>
              </div>
              <CardDescription className="text-lg">
                {worker.position}
              </CardDescription>
              <div className="flex items-center gap-4 mt-2">
                <Badge
                  variant={worker.status === "ACTIVE" ? "default" : "secondary"}
                >
                  {worker.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ID: #{workerNumber}
                </span>
              </div>
            </div>
            <Dialog
              open={isPayrollDialogOpen}
              onOpenChange={setIsPayrollDialogOpen}
            >
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Process Payment</DialogTitle>
                  <DialogDescription>
                    Process payment for {name}
                  </DialogDescription>
                </DialogHeader>
                <WorkerPaymentForm
                  worker={worker}
                  onCancel={() => setIsPayrollDialogOpen(false)}
                  onSubmitSuccess={() => {
                    setIsPayrollDialogOpen(false);
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
            <Button
              variant="outline"
              onClick={() => setIsPayrollDialogOpen(true)}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Process Payment
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
