"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Calendar,
} from "lucide-react";

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

  // Filter out cancelled quotations
  const activeQuotations = safeQuotations.filter(
    (quote) => quote.status !== "CANCELLED"
  );

  // Get converted quotations
  const convertedQuotations = activeQuotations.filter(
    (quote) => quote.status === "CONVERTED"
  );

  // Get pending quotations
  const pendingQuotations = activeQuotations.filter(
    (quote) => quote.status === "PENDING"
  );

  // Calculate converted amount
  const totalConvertedAmount = convertedQuotations.reduce(
    (sum, quote) => sum + quote.total,
    0
  );

  // Calculate total active amount (excluding cancelled)
  const totalActiveAmount = activeQuotations.reduce(
    (sum, quote) => sum + quote.total,
    0
  );

  // Calculate pending amount
  const totalPendingAmount = pendingQuotations.reduce(
    (sum, quote) => sum + quote.total,
    0
  );

  // Calculate averages
  const avgConvertedValue =
    convertedQuotations.length > 0
      ? totalConvertedAmount / convertedQuotations.length
      : 0;

  const avgPendingValue =
    pendingQuotations.length > 0
      ? totalPendingAmount / pendingQuotations.length
      : 0;

  // Calculate rates
  const conversionRate =
    activeQuotations.length > 0
      ? (convertedQuotations.length / activeQuotations.length) * 100
      : 0;

  const valueConversionRate =
    totalActiveAmount > 0
      ? (totalConvertedAmount / totalActiveAmount) * 100
      : 0;

  // Today's metrics
  const today = new Date().toDateString();
  const todayConverted = convertedQuotations.filter(
    (q) => new Date(q.createdAt).toDateString() === today
  );
  const todayConvertedAmount = todayConverted.reduce(
    (sum, q) => sum + q.total,
    0
  );
  const todayPending = pendingQuotations.filter(
    (q) => new Date(q.createdAt).toDateString() === today
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Total Converted Amount */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Converted</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-700">
            R{totalConvertedAmount.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground space-y-1 mt-2">
            <div className="flex justify-between">
              <span>Quotes:</span>
              <span className="font-medium">{convertedQuotations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Value:</span>
              <span>R{avgConvertedValue.toFixed(2)}</span>
            </div>
            {todayConvertedAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Today:</span>
                <span>R{todayConvertedAmount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Pending Amount */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
          <FileText className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-700">
            R{totalPendingAmount.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground space-y-1 mt-2">
            <div className="flex justify-between">
              <span>Quotes:</span>
              <span className="font-medium">{pendingQuotations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Value:</span>
              <span>R{avgPendingValue.toFixed(2)}</span>
            </div>
            {todayPending > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>New Today:</span>
                <span>{todayPending}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Conversion Metrics */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground space-y-1 mt-2">
            <div className="flex justify-between">
              <span>Value Rate:</span>
              <span className="font-medium">
                {valueConversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Converted:</span>
              <span>{convertedQuotations.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Total:</span>
              <span>{activeQuotations.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Today's Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Today's Performance
          </CardTitle>
          <Calendar className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {todayConverted.length > 0 ? `${todayConverted.length}` : "0"}
          </div>
          <div className="text-xs text-muted-foreground space-y-1 mt-2">
            <div className="flex justify-between">
              <span>Converted Today:</span>
              <span>{todayConverted.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Value Today:</span>
              <span className="font-medium">
                R{todayConvertedAmount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>New Pending:</span>
              <span>{todayPending}</span>
            </div>
            {todayConvertedAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Today's Success:</span>
                <span>✓</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
