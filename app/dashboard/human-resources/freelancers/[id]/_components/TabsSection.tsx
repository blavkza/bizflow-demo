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
import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { PaymentStatus, PaymentType } from "@prisma/client";
import axios from "axios";
import { formatCurrency } from "@/lib/formatters";
import { DocumentsTab } from "./DocumentsTab";
import { HealthSafetyCard } from "./HealthSafetyCard";

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
  payments?: any[];
}

interface CompanySettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  logo?: string;
}

export type TabsSectionProps = {
  freelancer: FreelancerWithDetails;
  hasFullAccess: boolean;
  canEditFreelancers: boolean;
  fetchFreelancer: () => void;
};

export default function TabsSection({
  freelancer,
  canEditFreelancers,
  hasFullAccess,
  fetchFreelancer,
}: TabsSectionProps) {
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
        `payslip-${freelancer.lastName}-${freelancer.firstName}-${format(new Date(), "yyyyMMdd")}.pdf`
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
        <TabsList className="grid grid-cols-3 w-full max-w-xs">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="">
            <div className="lg:col-span-2 space-y-6">
              <EmploymentDetailsCard freelancer={freelancer} />
              <ContactCard
                freelancer={freelancer}
                canEditFreelancers={canEditFreelancers}
                hasFullAccess={hasFullAccess}
                fetchFreelancer={fetchFreelancer}
              />
              <PersonalInfoCard
                freelancer={freelancer}
                canEditFreelancers={canEditFreelancers}
                hasFullAccess={hasFullAccess}
                fetchFreelancer={fetchFreelancer}
              />
              <HealthSafetyCard
                freelancer={freelancer}
                canEditFreelancers={canEditFreelancers}
                hasFullAccess={hasFullAccess}
                fetchFreelancer={fetchFreelancer}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card className="border-none shadow-none">
            <CardHeader className="px-4">
              <CardTitle>Payment History</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              {loadingSettings ? (
                <div className="flex justify-center py-8">
                  <p>Loading payment information...</p>
                </div>
              ) : freelancer.payments && freelancer.payments.length > 0 ? (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payslip</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {freelancer.payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.payDate), "dd MMM yyyy")}
                          </TableCell>
                          <TableCell className="truncate">
                            {payment.description || "-"}
                          </TableCell>
                          <TableCell className="capitalize">
                            {formatPaymentType(payment.type)}
                          </TableCell>
                          <TableCell>
                            {payment?.amount
                              ? formatCurrency(Number(payment.amount))
                              : "0.00"}
                          </TableCell>

                          <TableCell>
                            <Badge
                              className={getPaymentStatusColor(payment.status)}
                            >
                              {payment.status.toLowerCase()}
                            </Badge>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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
        <TabsContent value="documents" className="space-y-4">
          <DocumentsTab
            freelancer={freelancer}
            fetchFreelancer={fetchFreelancer}
            hasFullAccess={hasFullAccess}
            canEditFreelancer={canEditFreelancers}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
