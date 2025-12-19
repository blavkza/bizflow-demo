"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, DollarSign, TrendingUp, CheckCircle } from "lucide-react";

type QuoteStatus = "PENDING" | "CONVERTED" | "EXPIRED" | "CANCELLED";

interface Quotation {
  id: string;
  quoteNumber: string;
  createdAt: string;
  status: QuoteStatus;
  total: number;
  customerName?: string;
}

interface QuotationStatsProps {
  quotations?: Quotation[];
  loading?: boolean;
}

export default function QuotationStats({
  quotations = [],
  loading = false,
}: QuotationStatsProps) {
  // Loading skeleton
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Use safe quotations
  const safeQuotations = quotations || [];

  const totalQuotations = safeQuotations.length;

  // Total value of all quotations
  const totalQuotationValue = safeQuotations.reduce(
    (sum, quote) => sum + quote.total,
    0
  );

  // Average quotation value
  const avgQuotationValue =
    totalQuotations > 0 ? totalQuotationValue / totalQuotations : 0;

  // Today's quotations
  const todayQuotations = safeQuotations.filter((q) => {
    const quoteDate = new Date(q.createdAt);
    const today = new Date();
    return quoteDate.toDateString() === today.toDateString();
  }).length;

  // Converted quotations (accepted/sold)
  const convertedQuotations = safeQuotations.filter(
    (q) => q.status === "CONVERTED"
  );
  const conversionRate =
    totalQuotations > 0
      ? (convertedQuotations.length / totalQuotations) * 100
      : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Quotations
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalQuotations}</div>
          <p className="text-xs text-muted-foreground">
            All quotations created
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R{totalQuotationValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Value of all quotations
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Today's Quotations
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayQuotations}</div>
          <p className="text-xs text-muted-foreground">Created today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {convertedQuotations.length} of {totalQuotations} converted
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
