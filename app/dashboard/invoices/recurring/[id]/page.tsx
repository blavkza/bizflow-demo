// app/dashboard/invoices/recurring/[id]/page.tsx
"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { UserPermission, UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, formatDate } from "@/lib/invoiceUtils";
import {
  Repeat,
  Play,
  Pause,
  Square,
  Calendar,
  DollarSign,
  FileText,
  TrendingUp,
  User,
  Clock,
  MoreHorizontal,
  Edit,
} from "lucide-react";
import InvoiceForm from "../../new/_components/Invoice-Form";
import { toast } from "sonner";
import Loader from "../../[id]/_components/Loader";

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

interface RecurringInvoiceDetail {
  id: string;
  clientId: string;
  frequency: string;
  interval: number;
  startDate: string;
  endDate?: string;
  nextDate: string;
  status: string;
  description?: string;
  items: any[];
  currency: string;
  discountType?: "AMOUNT" | "PERCENTAGE";
  discountAmount?: number;
  paymentTerms?: string;
  notes?: string;
  totalInvoicesGenerated: number;
  lastGeneratedAt?: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    issueDate: string;
    totalAmount: number;
    status: string;
  }>;
}
export default function RecurringInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { userId } = useAuth();
  const [recurringInvoice, setRecurringInvoice] =
    useState<RecurringInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: userData } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    const fetchRecurringInvoice = async () => {
      try {
        const response = await fetch(`/api/invoices/recurring/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch recurring invoice");
        }
        const data = await response.json();
        setRecurringInvoice(data);
      } catch (error) {
        console.error("Error fetching recurring invoice:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecurringInvoice();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-blue-500 text-white";
      case "PAUSED":
        return "bg-orange-500 text-white";
      case "COMPLETED":
        return "bg-green-500 text-white";
      case "CANCELLED":
        return "bg-red-500 text-white";
      default:
        return "bg-red-500 text-white";
    }
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "DAILY":
        return "bg-blue-100 text-blue-800";
      case "WEEKLY":
        return "bg-green-100 text-green-800";
      case "MONTHLY":
        return "bg-purple-100 text-purple-800";
      case "QUARTERLY":
        return "bg-orange-100 text-orange-800";
      case "YEARLY":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getFrequencyLabel = (frequency: string, interval: number) => {
    const intervalText = interval > 1 ? `${interval} ` : "";
    switch (frequency) {
      case "DAILY":
        return `${intervalText}day${interval > 1 ? "s" : ""}`;
      case "WEEKLY":
        return `${intervalText}week${interval > 1 ? "s" : ""}`;
      case "MONTHLY":
        return `${intervalText}month${interval > 1 ? "s" : ""}`;
      case "QUARTERLY":
        return `${intervalText}quarter${interval > 1 ? "s" : ""}`;
      case "YEARLY":
        return `${intervalText}year${interval > 1 ? "s" : ""}`;
      default:
        return frequency.toLowerCase();
    }
  };

  const calculateNextAmount = () => {
    if (!recurringInvoice?.items) return 0;
    return recurringInvoice.items.reduce((sum: number, item: any) => {
      return sum + item.quantity * item.unitPrice;
    }, 0);
  };

  const calculateTotalRevenue = () => {
    if (!recurringInvoice?.invoices) return 0;
    return recurringInvoice.invoices.reduce((sum: number, invoice: any) => {
      return sum + invoice.totalAmount;
    }, 0);
  };

  const calculateAverageInvoiceAmount = () => {
    if (!recurringInvoice?.invoices || recurringInvoice.invoices.length === 0)
      return 0;
    return calculateTotalRevenue() / recurringInvoice.invoices.length;
  };

  const getDaysUntilNextInvoice = () => {
    if (!recurringInvoice?.nextDate) return 0;
    const nextDate = new Date(recurringInvoice.nextDate);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusStats = () => {
    if (!recurringInvoice?.invoices) return { paid: 0, pending: 0, overdue: 0 };

    return recurringInvoice.invoices.reduce(
      (stats: any, invoice: any) => {
        if (invoice.status === "PAID") stats.paid++;
        else if (invoice.status === "OVERDUE") stats.overdue++;
        else stats.pending++;
        return stats;
      },
      { paid: 0, pending: 0, overdue: 0 },
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!recurringInvoice) return;

    setIsProcessing(true);
    try {
      const response = await fetch(
        `/api/invoices/recurring/${recurringInvoice.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const updatedInvoice = await response.json();
      setRecurringInvoice(updatedInvoice);

      toast.success(
        `Recurring invoice ${newStatus.toLowerCase()} successfully`,
      );
    } catch (error) {
      console.error("Failed to update recurring invoice status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitSuccess = () => {
    setIsEditDialogOpen(false);
    // Refresh the data
    fetchRecurringInvoice();
    toast.success("Recurring invoice updated successfully");
  };

  const fetchRecurringInvoice = async () => {
    try {
      const response = await fetch(`/api/invoices/recurring/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch recurring invoice");
      }
      const data = await response.json();
      setRecurringInvoice(data);
    } catch (error) {
      console.error("Error fetching recurring invoice:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Loader />
      </div>
    );
  }

  if (!recurringInvoice) {
    return <div className="p-6">Recurring invoice not found</div>;
  }

  const statusStats = getStatusStats();
  const daysUntilNext = getDaysUntilNextInvoice();
  const totalRevenue = calculateTotalRevenue();
  const averageAmount = calculateAverageInvoiceAmount();
  const nextAmount = calculateNextAmount();

  // Prepare data for the edit form
  const invoiceData = {
    id: recurringInvoice.id,
    clientId: recurringInvoice.clientId,
    description: recurringInvoice.description || "",
    status: recurringInvoice.status as any,
    issueDate: new Date(recurringInvoice.startDate),
    dueDate: new Date(recurringInvoice.nextDate),
    currency: "ZAR",
    items: recurringInvoice.items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate || 0,
      shopProductId: item.shopProductId || null,
    })),
    discountType: recurringInvoice.discountType as any,
    discountAmount: recurringInvoice.discountAmount,
    paymentTerms: recurringInvoice.paymentTerms || "",
    notes: recurringInvoice.notes || "",
    isRecurring: true,
    frequency: recurringInvoice.frequency as any,
    interval: recurringInvoice.interval,
    endDate: recurringInvoice.endDate
      ? new Date(recurringInvoice.endDate)
      : undefined,
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex gap-4 items-center">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/invoices")}
            >
              Back
            </Button>
            <div className="">
              {" "}
              <h1 className="text-3xl font-bold">Recurring Invoice</h1>{" "}
              <p className="text-muted-foreground">
                {recurringInvoice.description || "No description"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(recurringInvoice.status)}>
            {recurringInvoice.status}
          </Badge>

          {/* Action Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* Edit Option */}
              <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>

              {/* Status Management Options */}
              {recurringInvoice.status === "ACTIVE" && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange("PAUSED")}
                  disabled={isProcessing}
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}

              {recurringInvoice.status === "PAUSED" && (
                <DropdownMenuItem
                  onClick={() => handleStatusChange("ACTIVE")}
                  disabled={isProcessing}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </DropdownMenuItem>
              )}

              {/* Cancel Option */}
              {recurringInvoice.status !== "CANCELLED" &&
                recurringInvoice.status !== "COMPLETED" && (
                  <DropdownMenuItem
                    onClick={() => handleStatusChange("CANCELLED")}
                    disabled={isProcessing}
                    className="text-red-600"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Cancel
                  </DropdownMenuItem>
                )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(nextAmount)}
            </div>
            <p className="text-xs text-muted-foreground">Next invoice amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {recurringInvoice.totalInvoicesGenerated} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Invoice</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {daysUntilNext > 0 ? daysUntilNext : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {daysUntilNext > 0 ? "days remaining" : "Due now"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Average Invoice
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(averageAmount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per generated invoice
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recurring Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5" />
              Recurring Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Frequency
              </span>
              <Badge className={getFrequencyColor(recurringInvoice.frequency)}>
                Every{" "}
                {getFrequencyLabel(
                  recurringInvoice.frequency,
                  recurringInvoice.interval,
                )}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Next Invoice
              </span>
              <div className="flex items-center gap-2 font-medium">
                <Calendar className="w-4 h-4" />
                {formatDate(recurringInvoice.nextDate)}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Start Date
              </span>
              <span className="font-medium">
                {formatDate(recurringInvoice.startDate)}
              </span>
            </div>
            {recurringInvoice.endDate && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  End Date
                </span>
                <span className="font-medium">
                  {formatDate(recurringInvoice.endDate)}
                </span>
              </div>
            )}
            {recurringInvoice.lastGeneratedAt && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">
                  Last Generated
                </span>
                <span className="font-medium">
                  {formatDate(recurringInvoice.lastGeneratedAt)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Info & Status Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Client & Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Client Information</h4>
              <div className="space-y-1">
                <div className="font-medium">
                  {recurringInvoice.client.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  {recurringInvoice.client.email}
                </div>
                {recurringInvoice.client.phone && (
                  <div className="text-sm text-muted-foreground">
                    {recurringInvoice.client.phone}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">
                Invoice Status Breakdown
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {statusStats.paid}
                  </div>
                  <div className="text-xs text-muted-foreground">Paid</div>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">
                    {statusStats.pending}
                  </div>
                  <div className="text-xs text-muted-foreground">Pending</div>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {statusStats.overdue}
                  </div>
                  <div className="text-xs text-muted-foreground">Overdue</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoice Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Unit Price</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recurringInvoice.items.map((item: any, index: number) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {item.description}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </TableCell>
                </TableRow>
              ))}
              {/* Total Row */}
              <TableRow className="bg-muted/50">
                <TableCell colSpan={3} className="text-right font-medium">
                  Total Amount:
                </TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {formatCurrency(nextAmount)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Generated Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {recurringInvoice.invoices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recurringInvoice.invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{invoice.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/dashboard/invoices/${invoice.id}`)
                        }
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No invoices generated yet</p>
              <p className="text-sm">
                The first invoice will be generated on{" "}
                {formatDate(recurringInvoice.nextDate)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recurring Invoice</DialogTitle>
            <DialogDescription>
              Update the details of this recurring invoice.
            </DialogDescription>
          </DialogHeader>
          <InvoiceForm
            type="update"
            data={{ invoice: invoiceData }}
            onCancel={() => setIsEditDialogOpen(false)}
            onSubmitSuccess={handleSubmitSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
