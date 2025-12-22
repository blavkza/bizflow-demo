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
import {
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  FileText,
  Edit,
  ArrowLeft,
  Tag,
  Package,
  Building,
  CreditCard,
  Receipt,
  Clock,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Plus,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { DocumentsTab } from "./components/DocumentsTab";
import { EditVendorDialog } from "./components/EditVendorDialog";
import { VendorLoadingSkeleton } from "./components/VendorLoadingSkeleton";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import axios from "axios";
import AddExpenseDialog from "../../expenses/Components/AddExpenseDialog";
import { Category } from "@prisma/client";

interface Vendor {
  id: string;
  name: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  phone2?: string | null;
  website: string | null;
  address: string | null;
  taxNumber: string | null;
  registrationNumber?: string | null;
  categories:
    | string[]
    | { id: string; name: string; description: string | null }[];
  type: string;
  paymentTerms: string | null;
  notes: string | null;
  status: string;
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
  category: Category;
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

interface CategoryOption {
  label: string;
  value: string;
  type: string;
  color?: string;
}

interface VendorOption {
  label: string;
  value: string;
}

export default function VendorDetailPage() {
  const params = useParams();
  const vendorId = params.id as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [categoriesOptions, setCategoriesOptions] = useState<CategoryOption[]>(
    []
  );
  const [vendorsOptions, setVendorsOptions] = useState<VendorOption[]>([]);

  const router = useRouter();

  useEffect(() => {
    fetchVendor();
    fetchCategories();
    fetchVendors();
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

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/category");
      const categories: any[] = response?.data || [];

      const expenseCategories = categories.filter(
        (category) =>
          category.id && category.name && category.type === "EXPENSE"
      );

      const options = expenseCategories.map((category) => ({
        label: category.name || "",
        value: category.id,
        type: category.type,
        color: category.color,
      }));

      setCategoriesOptions(options);
    } catch (err) {
      console.error("Error fetching categories:", err);
      toast.error("Failed to load categories");
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      if (!response.ok) throw new Error("Failed to fetch vendors");
      const data = await response.json();

      const options = data.map((vendor: any) => ({
        label: vendor.name,
        value: vendor.id,
      }));

      setVendorsOptions(options);
    } catch (error) {
      console.error("Failed to fetch vendors:", error);
    }
  };

  const handleVendorUpdated = () => {
    fetchVendor();
  };

  const handleExpenseAdded = () => {
    fetchVendor(); // Refresh vendor data to show new expense
  };

  const getCategoryNames = (categories: Vendor["categories"]): string[] => {
    if (!categories) return [];
    if (Array.isArray(categories)) {
      if (categories.length === 0) return [];
      if (typeof categories[0] === "string") {
        return categories as string[];
      } else {
        return (categories as { name: string }[]).map((cat) => cat.name);
      }
    }
    return [];
  };

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
        return "bg-green-100 text-green-800";
      case "PARTIAL":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "OVERDUE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getVendorStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA");
  };

  const formatEnumValue = (value: string) => {
    return value
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (loading) {
    return <VendorLoadingSkeleton />;
  }

  if (!vendor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Vendor Not Found</h2>
          <p className="text-gray-500">
            The vendor you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const categoryNames = getCategoryNames(vendor.categories);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <Button variant={"outline"} onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
          </Button>

          <h1 className="text-lg font-semibold">{vendor.name}</h1>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVendorStatusColor(vendor.status)}`}
          >
            {vendor.status}
          </span>
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
                      <span className="text-sm text-gray-500">
                        {formatEnumValue(vendor.type)}
                      </span>
                      {categoryNames.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3 text-muted-foreground" />
                          <div className="flex flex-wrap gap-1">
                            {categoryNames
                              .slice(0, 3)
                              .map((categoryName, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {categoryName}
                                </Badge>
                              ))}
                            {categoryNames.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{categoryNames.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsEditDialogOpen(true)}
                      variant="outline"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Vendor
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vendor.fullName && (
                    <div className="flex items-center gap-3">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{vendor.fullName}</span>
                    </div>
                  )}
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
                  {vendor.phone2 && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{vendor.phone2}</span>
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
                  {vendor.registrationNumber && (
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Reg: {vendor.registrationNumber}
                      </span>
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
                label: `Documents `,
              },
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
                          <Badge variant="outline">
                            {expense.category.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(expense.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(expense.paidAmount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(expense.status)}`}
                          >
                            {expense.status}
                          </span>
                        </TableCell>
                        <TableCell>{formatDate(expense.dueDate)}</TableCell>
                        <TableCell>
                          <Link href={`/dashboard/expenses/${expense.id}`}>
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
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendor.expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category.name}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(expense.totalAmount)}
                      </TableCell>
                      <TableCell className="text-green-600">
                        {formatCurrency(expense.paidAmount)}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {formatCurrency(expense.remainingAmount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(expense.status)}`}
                        >
                          {expense.status}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(expense.dueDate)}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            expense.priority === "HIGH"
                              ? "text-red-600"
                              : expense.priority === "MEDIUM"
                                ? "text-orange-600"
                                : "text-green-600"
                          }`}
                        >
                          {expense.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Link href={`/expenses/${expense.id}`}>
                          <Button variant="ghost" size="sm">
                            View
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

      {/* Add Expense Dialog */}
      {isAddDialogOpen && (
        <AddExpenseDialog
          open={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onExpenseAdded={handleExpenseAdded}
          categoriesOptions={categoriesOptions}
          vendorsOptions={vendorsOptions}
          defaultVendorId={vendorId}
        />
      )}
    </div>
  );
}
