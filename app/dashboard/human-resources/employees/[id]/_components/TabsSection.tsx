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
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import { ContactCard } from "./ContactCard";
import { PersonalInfoCard } from "./PersonalInfoCard";
import { EmploymentDetailsCard } from "./EmploymentDetailsCard";
import { QuickActionsCard } from "./QuickActionsCard";
import { TabsSectionProps } from "@/types/employee";
import { PayslipPDF } from "./PayslipPDF";
import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { PaymentStatus, PaymentType } from "@prisma/client";
import axios from "axios";

interface CompanySettings {
  id: string;
  companyName: string;
  taxId?: string;
  address?: string;
  city?: string;
  website?: string;
  paymentTerms?: string;
  note?: string;
  bankAccount?: string;
  bankAccount2?: string;
  bankName?: string;
  bankName2?: string;
  logo?: string;
  province?: string;
  postCode?: string;
  phone?: string;
  phone2?: string;
  phone3?: string;
  email?: string;
}

export default function TabsSection({ employee }: TabsSectionProps) {
  const [generatingPayslipId, setGeneratingPayslipId] = useState<string | null>(
    null
  );
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const payslipRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await axios.get("/api/settings/general");
        setCompanySettings(response.data.data);
      } catch (error) {
        console.error("Error fetching company settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchCompanySettings();
  }, []);

  const getPaymentStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatPaymentType = (type: PaymentType) => {
    return type.toLowerCase().replace(/_/g, " ");
  };

  const handleDownloadPayslip = async (paymentId: string) => {
    if (!companySettings) {
      alert("Company information is not available. Please try again later.");
      return;
    }

    const payslipRef = payslipRefs.current[paymentId];
    if (!payslipRef) return;

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
      alert("Failed to generate payslip. Please try again.");
    } finally {
      if (payslipRef) {
        payslipRef.style.position = "absolute";
        payslipRef.style.visibility = "hidden";
      }
      setGeneratingPayslipId(null);
    }
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-xs">
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
          <Card className="border-none shadow-none">
            <CardHeader className="px-0">
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {loadingSettings ? (
                <div className="flex justify-center py-8">
                  <p>Loading payment information...</p>
                </div>
              ) : employee.payments && employee.payments.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Payslip</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="py-3">
                          {format(new Date(payment.payDate), "dd MMM yyyy")}
                        </TableCell>
                        <TableCell>{payment.description || "-"}</TableCell>
                        <TableCell className="capitalize">
                          {formatPaymentType(payment.type)}
                        </TableCell>
                        <TableCell>ZAR {payment.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge
                            className={getPaymentStatusColor(payment.status)}
                          >
                            {payment.status.toLowerCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadPayslip(payment.id)}
                            disabled={
                              generatingPayslipId === payment.id ||
                              !companySettings
                            }
                            className="hover:bg-gray-100"
                          >
                            <DownloadIcon className="h-4 w-4 mr-2" />
                            {generatingPayslipId === payment.id
                              ? "Generating..."
                              : !companySettings
                                ? "Unavailable"
                                : "Download"}
                          </Button>
                          {companySettings && (
                            <PayslipPDF
                              ref={(el) =>
                                (payslipRefs.current[payment.id] = el)
                              }
                              employee={employee}
                              payment={payment}
                              companySettings={companySettings}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex justify-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No payment history available
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
