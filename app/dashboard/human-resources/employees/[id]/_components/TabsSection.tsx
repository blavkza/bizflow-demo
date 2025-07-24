// TabsSection.tsx
"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import { ContactCard } from "./ContactCard";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { EmploymentDetailsCard } from "./EmploymentDetailsCard";
import { QuickActionsCard } from "./QuickActionsCard";
import { TabsSectionProps } from "@/types/employee";
import StatsCard from "./Stats-Card";

export default function TabsSection({ employee }: TabsSectionProps) {
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <Tabs defaultValue="overview" className="space-y-4 p-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <ContactCard employee={employee} />
              <PersonalInfoCard employee={employee} />
            </div>
            <div className="space-y-6">
              <EmploymentDetailsCard employee={employee} />
              <QuickActionsCard employee={employee} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.payments && employee.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.payDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{payment.description || "-"}</TableCell>

                        <TableCell>{payment.type}</TableCell>
                        <TableCell>
                          R{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getPaymentStatusColor(payment.status)}
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No payment history available
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
