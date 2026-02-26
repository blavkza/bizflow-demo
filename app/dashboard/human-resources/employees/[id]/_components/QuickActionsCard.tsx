// QuickActionsCard.tsx
"use client";
import { useState } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendEmailDialog } from "@/components/SendEmailDialog";
import { EmployeeWithDetails } from "@/types/employee";

export function QuickActionsCard({
  employee,
}: {
  employee: EmployeeWithDetails;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <SendEmailDialog
          recipientName={`${employee.firstName} ${employee.lastName}`}
          recipientEmail={employee.email || ""}
          trigger={
            <Button variant="outline" className="w-full justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          }
        />
      </CardContent>
    </Card>
  );
}
