"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DollarSign,
  FileText,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Download,
  Plus,
  Eye,
  Edit,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { DocumentsTab } from "./components/DocumentsTab";
import { EditVendorDialog } from "./components/EditVendorDialog";
import { VendorLoadingSkeleton } from "./components/VendorLoadingSkeleton";
import { formatCurrency } from "@/lib/formatters";

interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  taxNumber: string | null;
  category: string | null;
  paymentTerms: string | null;
  notes: string | null;
  status: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  expenses: Expense[];
  _count: {
    expenses: number;
    documents: number;
  };
}

interface Expense {
  id: string;
  description: string;
  category: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  dueDate: string;
  paidDate: string | null;
  paymentMethod: string;
  priority: string;
  project?: {
    id: string;
    title: string;
    projectNumber: string;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
}

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/vendors/${vendorId}`);
      if (!response.ok) throw new Error("Failed to fetch vendor");
      const data = await response.json();
      setVendor(data);
    } catch (error) {
      console.error("Failed to fetch vendor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVendorUpdated = () => {
    fetchVendor(); // Refresh vendor data after update
  };

  // Calculate vendor financial summary
  const financialSummary = vendor
    ? {
        totalExpenses: parseFloat(
          vendor.expenses
            .reduce((sum, exp) => sum + Number(exp.totalAmount) || 0, 0)
            .toFixed(2)
        ),
        totalPaid: parseFloat(
          vendor.expenses
            .reduce((sum, exp) => sum + Number(exp.paidAmount) || 0, 0)
            .toFixed(2)
        ),
        totalOwed: parseFloat(
          vendor.expenses
            .reduce((sum, exp) => sum + Number(exp.remainingAmount) || 0, 0)
            .toFixed(2)
        ),
        overdueAmount: parseFloat(
          vendor.expenses
            .filter(
              (exp) =>
                new Date(exp.dueDate) < new Date() && exp.status !== "PAID"
            )
            .reduce((sum, exp) => sum + Number(exp.remainingAmount) || 0, 0)
            .toFixed(2)
        ),
        expenseCount: vendor.expenses.length,
        paidCount: vendor.expenses.filter((exp) => exp.status === "PAID")
          .length,
        pendingCount: vendor.expenses.filter((exp) => exp.status === "PENDING")
          .length,
        partialCount: vendor.expenses.filter((exp) => exp.status === "PARTIAL")
          .length,
        overdueCount: vendor.expenses.filter(
          (exp) => new Date(exp.dueDate) < new Date() && exp.status !== "PAID"
        ).length,
      }
    : null;

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return "default";
      case "PARTIAL":
        return "secondary";
      case "PENDING":
        return "outline";
      case "OVERDUE":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getVendorStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "default";
      case "INACTIVE":
        return "secondary";
      case "PENDING":
        return "outline";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toUpperCase()) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-orange-600";
      case "LOW":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA");
  };

  if (loading) {
    return (
      <div className="py-10">
        {" "}
        <VendorLoadingSkeleton />;
      </div>
    );
  }

  if (!vendor) {
    return (
      <div>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Vendor Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The vendor you're looking for doesn't exist.
            </p>

            <Button variant={"outline"} onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <Button variant={"outline"} onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>

          <h1 className="text-lg font-semibold">{vendor.name}</h1>
          <Badge variant={getVendorStatusColor(vendor.status)}>
            {vendor.status}
          </Badge>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        {/* Vendor Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">{vendor.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      {vendor.category && (
                        <Badge variant="outline">{vendor.category}</Badge>
                      )}
                      {vendor.tags && vendor.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <div className="flex flex-wrap gap-1">
                            {vendor.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {vendor.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{vendor.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsEditDialogOpen(true)}
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Vendor
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendor.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={vendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{vendor.address}</span>
                    </div>
                  )}
                  {vendor.taxNumber && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Tax: {vendor.taxNumber}</span>
                    </div>
                  )}
                  {vendor.paymentTerms && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Terms: {vendor.paymentTerms}
                      </span>
                    </div>
                  )}
                </div>

                {vendor.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {vendor.notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="lg:w-80 space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(financialSummary?.totalPaid || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Paid</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(financialSummary?.totalOwed || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Amount Owed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(financialSummary?.overdueAmount || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Overdue</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "expenses", label: `Expenses (${vendor.expenses.length})` },
              {
                id: "documents",
                label: `Documents (${vendor._count.documents})`,
              },
              { id: "payments", label: "Payment History" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid gap-6">
            {/* Financial Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Business
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(financialSummary?.totalExpenses || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {financialSummary?.expenseCount} expenses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Paid</CardTitle>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(financialSummary?.totalPaid || 0)}
                  </div>
                  <Progress
                    value={
                      financialSummary && financialSummary.totalExpenses > 0
                        ? (financialSummary.totalPaid /
                            financialSummary.totalExpenses) *
                          100
                        : 0
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {financialSummary?.paidCount} paid expenses
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Outstanding
                  </CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(financialSummary?.totalOwed || 0)}
                  </div>
                  <Progress
                    value={
                      financialSummary && financialSummary.totalExpenses > 0
                        ? (financialSummary.totalOwed /
                            financialSummary.totalExpenses) *
                          100
                        : 0
                    }
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {financialSummary
                      ? financialSummary.pendingCount +
                        financialSummary.partialCount
                      : 0}{" "}
                    pending
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {financialSummary?.overdueCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {financialSummary?.overdueCount || 0} expenses overdue
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Expenses */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>
                  Latest expenses with this vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.expenses.slice(0, 5).map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">
                          {expense.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{expense.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(expense.paidAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(expense.status)}>
                            {expense.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(expense.dueDate)}</TableCell>
                        <TableCell>
                          <Link href={`/expenses/${expense.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {vendor.expenses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No expenses found for this vendor.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "expenses" && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Expenses</CardTitle>
                  <CardDescription>
                    Complete expense history with {vendor.name}
                  </CardDescription>
                </div>
                <Link href={`/expenses?vendorId=${vendor.id}`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendor.expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.id}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(expense.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right text-orange-600">
                        {formatCurrency(expense.remainingAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(expense.status)}>
                          {expense.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(expense.dueDate)}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${getPriorityColor(expense.priority)}`}
                        >
                          {expense.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        {expense.project ? (
                          <Badge variant="secondary">
                            <Building className="h-3 w-3 mr-1" />
                            {expense.project.projectNumber}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/expenses/${expense.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {vendor.expenses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No expenses found for this vendor.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "documents" && (
          <DocumentsTab vendor={vendor} fetchVendor={fetchVendor} />
        )}

        {activeTab === "payments" && (
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                All payments made to {vendor.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Payment history feature coming soon...
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Vendor Dialog */}
      {vendor && (
        <EditVendorDialog
          vendor={vendor}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onVendorUpdated={handleVendorUpdated}
        />
      )}
    </div>
  );
}
