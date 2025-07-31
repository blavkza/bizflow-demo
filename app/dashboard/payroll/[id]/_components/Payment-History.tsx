"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import { Employee, PaymentType } from "@prisma/client";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { PayslipPDF } from "@/app/dashboard/human-resources/employees/[id]/_components/PayslipPDF";

interface PaymentHistoryProps {
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
      type: PaymentType;
      status: string;
      description?: string | null;
    }[];
  };
  companySettings?: {
    companyName: string;
    logo?: string;
    address?: string;
    city?: string;
    province?: string;
    postCode?: string;
    phone?: string;
    email?: string;
    taxId?: string;
  };
}

export default function PaymentHistory({
  employee,
  companySettings,
}: PaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<PaymentType | "all">("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [generatingPayslipId, setGeneratingPayslipId] = useState<string | null>(
    null
  );
  const payslipRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Filter payments based on search and filters
  const filteredPayments = employee.payments?.filter((payment) => {
    const matchesSearch =
      searchTerm === "" ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.amount.toString().includes(searchTerm);
    const matchesType = typeFilter === "all" || payment.type === typeFilter;
    const paymentYear = new Date(payment.payDate).getFullYear().toString();
    const matchesYear = yearFilter === "all" || paymentYear === yearFilter;
    return matchesSearch && matchesType && matchesYear;
  });

  // Get unique years from payments for year filter
  const paymentYears = [
    ...new Set(
      employee.payments?.map((payment) =>
        new Date(payment.payDate).getFullYear().toString()
      ) || []
    ),
  ].sort((a, b) => parseInt(b) - parseInt(a));

  const handleDownloadPayslip = async (paymentId: string) => {
    const payslipRef = payslipRefs.current[paymentId];
    if (!payslipRef || !companySettings) return;

    setGeneratingPayslipId(paymentId);
    try {
      // Temporarily make the payslip visible for capture
      payslipRef.style.position = "fixed";
      payslipRef.style.top = "0";
      payslipRef.style.left = "0";
      payslipRef.style.zIndex = "9999";
      payslipRef.style.visibility = "visible";

      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(payslipRef, {
        scale: 2,
        logging: true,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(
        `payslip-${employee.lastName}-${employee.firstName}-${format(new Date(), "yyyyMMdd")}.pdf`
      );
    } catch (error) {
      console.error("Payslip generation error:", error);
    } finally {
      if (payslipRef) {
        payslipRef.style.position = "absolute";
        payslipRef.style.visibility = "hidden";
      }
      setGeneratingPayslipId(null);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Complete payment record for {employee.firstName} {employee.lastName}
          </CardDescription>
          <div className="flex gap-2 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search payments..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as PaymentType | "all")
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(PaymentType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={yearFilter}
              onValueChange={(value) => setYearFilter(value)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {paymentYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments?.length === 0 ? (
            <div className="flex items-center justify-center p-6">
              No payments found matching your criteria
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Payslip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments?.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.payDate), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      {payment.type.charAt(0).toUpperCase() +
                        payment.type.slice(1).toLowerCase()}
                    </TableCell>
                    <TableCell className="truncate">
                      {payment.description || "No description"}
                    </TableCell>
                    <TableCell>
                      R
                      {payment.amount.toLocaleString("en-ZA", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === "PAID" ? "default" : "secondary"
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadPayslip(payment.id)}
                        disabled={
                          generatingPayslipId === payment.id || !companySettings
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {generatingPayslipId === payment.id
                          ? "Generating..."
                          : !companySettings
                            ? "Unavailable"
                            : "Download"}
                      </Button>
                      <PayslipPDF
                        ref={(el) => (payslipRefs.current[payment.id] = el)}
                        employee={employee}
                        payment={payment}
                        companySettings={companySettings}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
