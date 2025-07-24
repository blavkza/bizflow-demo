"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { QuotationWithRelations } from "@/types/quotation";

interface QuotationStatsProps {
  quotations: QuotationWithRelations[];
}

export function QuotationStats({ quotations }: QuotationStatsProps) {
  // Current month and year for filtering
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Calculate stats from quotations
  const draftQuotations = quotations.filter((q) => q.status === "DRAFT");
  const convertedThisMonth = quotations.filter((q) => {
    const updatedDate = new Date(q.updatedAt);
    return (
      q.status === "CONVERTED" &&
      updatedDate.getMonth() === currentMonth &&
      updatedDate.getFullYear() === currentYear
    );
  });
  const totalQuotations = quotations.length;
  const convertedQuotations = quotations.filter(
    (q) => q.status === "CONVERTED"
  );
  const conversionRate =
    totalQuotations > 0
      ? Math.round((convertedQuotations.length / totalQuotations) * 100)
      : 0;
  const averageValue =
    totalQuotations > 0
      ? quotations.reduce((sum, q) => sum + Number(q.totalAmount), 0) /
        totalQuotations
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Draft Quotations Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Draft Quotations
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R
            {draftQuotations
              .reduce((sum, q) => sum + Number(q.totalAmount), 0)
              .toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {draftQuotations.length} draft quotation
            {draftQuotations.length !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Converted This Month Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Converted This Month
          </CardTitle>
          <FileText className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R
            {convertedThisMonth
              .reduce((sum, q) => sum + Number(q.totalAmount), 0)
              .toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {convertedThisMonth.length} quotation
            {convertedThisMonth.length !== 1 ? "s" : ""} converted
          </p>
        </CardContent>
      </Card>

      {/* Conversion Rate Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <FileText className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {conversionRate}%
          </div>
          <p className="text-xs text-muted-foreground">
            {convertedQuotations.length} out of {totalQuotations} converted
          </p>
        </CardContent>
      </Card>

      {/* Total Converted Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Converted</CardTitle>
          <FileText className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            R
            {convertedQuotations
              .reduce((sum, q) => sum + Number(q.totalAmount), 0)
              .toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {convertedQuotations.length} quotation
            {convertedQuotations.length !== 1 ? "s" : ""} converted all time
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
