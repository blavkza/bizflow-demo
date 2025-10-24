"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Download,
  Eye,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";

const expenses = [
  {
    id: "EXP001",
    description: "Office Rent - December",
    category: "Rent",
    vendor: "Property Management Co.",
    totalAmount: 25000,
    paidAmount: 25000,
    remainingAmount: 0,
    status: "Paid",
    dueDate: "2024-01-05",
    paidDate: "2024-01-03",
    paymentMethod: "Bank Transfer",
    priority: "High",
  },
  {
    id: "EXP002",
    description: "IT Equipment Purchase",
    category: "Technology",
    vendor: "Tech Suppliers Ltd",
    totalAmount: 45000,
    paidAmount: 20000,
    remainingAmount: 25000,
    status: "Partial",
    dueDate: "2024-01-15",
    paidDate: null,
    paymentMethod: "Credit",
    priority: "Medium",
  },
  {
    id: "EXP003",
    description: "Marketing Campaign Q1",
    category: "Marketing",
    vendor: "Digital Marketing Agency",
    totalAmount: 60000,
    paidAmount: 0,
    remainingAmount: 60000,
    status: "Pending",
    dueDate: "2024-01-20",
    paidDate: null,
    paymentMethod: "Invoice",
    priority: "High",
  },
  {
    id: "EXP004",
    description: "Office Supplies",
    category: "Supplies",
    vendor: "Office Depot",
    totalAmount: 3500,
    paidAmount: 3500,
    remainingAmount: 0,
    status: "Paid",
    dueDate: "2024-01-10",
    paidDate: "2024-01-08",
    paymentMethod: "Credit Card",
    priority: "Low",
  },
  {
    id: "EXP005",
    description: "Legal Services",
    category: "Professional Services",
    vendor: "Law Firm Associates",
    totalAmount: 15000,
    paidAmount: 5000,
    remainingAmount: 10000,
    status: "Partial",
    dueDate: "2024-01-18",
    paidDate: null,
    paymentMethod: "Bank Transfer",
    priority: "Medium",
  },
  {
    id: "EXP006",
    description: "Software Licenses Annual",
    category: "Technology",
    vendor: "Software Vendor Inc",
    totalAmount: 28000,
    paidAmount: 0,
    remainingAmount: 28000,
    status: "Overdue",
    dueDate: "2024-01-02",
    paidDate: null,
    paymentMethod: "Bank Transfer",
    priority: "High",
  },
];

export default function ExpensesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.totalAmount, 0);
  const totalPaid = expenses.reduce((sum, exp) => sum + exp.paidAmount, 0);
  const totalRemaining = expenses.reduce(
    (sum, exp) => sum + exp.remainingAmount,
    0
  );
  const overdueCount = expenses.filter(
    (exp) => exp.status === "Overdue"
  ).length;

  // Filter expenses
  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || expense.status.toLowerCase() === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Partial":
        return "secondary";
      case "Pending":
        return "outline";
      case "Overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "text-red-600";
      case "Medium":
        return "text-orange-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Expense Management</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R{totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                All recorded expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R{totalPaid.toLocaleString()}
              </div>
              <Progress
                value={(totalPaid / totalExpenses) * 100}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((totalPaid / totalExpenses) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Remaining</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                R{totalRemaining.toLocaleString()}
              </div>
              <Progress
                value={(totalRemaining / totalExpenses) * 100}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {((totalRemaining / totalExpenses) * 100).toFixed(1)}%
                outstanding
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
                {overdueCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {overdueCount > 0
                  ? "Requires immediate attention"
                  : "All payments on track"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Rent">Rent</SelectItem>
                <SelectItem value="Technology">Technology</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Supplies">Supplies</SelectItem>
                <SelectItem value="Professional Services">
                  Professional Services
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>
                    Record a new business expense with payment details.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Input
                      id="description"
                      placeholder="Expense description"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="vendor" className="text-right">
                      Vendor
                    </Label>
                    <Input
                      id="vendor"
                      placeholder="Vendor name"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="category" className="text-right">
                      Category
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rent</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="services">
                          Professional Services
                        </SelectItem>
                        <SelectItem value="utilities">Utilities</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Total Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="paid" className="text-right">
                      Amount Paid
                    </Label>
                    <Input
                      id="paid"
                      type="number"
                      placeholder="0.00"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="dueDate" className="text-right">
                      Due Date
                    </Label>
                    <div className="col-span-3">
                      <DatePicker />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priority" className="text-right">
                      Priority
                    </Label>
                    <Select>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">
                      Notes
                    </Label>
                    <Textarea
                      id="notes"
                      placeholder="Additional notes..."
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Add Expense
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Expenses Table */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Records</CardTitle>
            <CardDescription>
              Showing {filteredExpenses.length} of {expenses.length} expenses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">{expense.id}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{expense.vendor}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R{expense.totalAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      R{expense.paidAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      R{expense.remainingAmount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(expense.status)}>
                        {expense.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.dueDate}</TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${getPriorityColor(expense.priority)}`}
                      >
                        {expense.priority}
                      </span>
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
          </CardContent>
        </Card>

        {/* Payment Status Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fully Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {expenses.filter((e) => e.status === "Paid").length}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                R
                {expenses
                  .filter((e) => e.status === "Paid")
                  .reduce((sum, e) => sum + e.totalAmount, 0)
                  .toLocaleString()}{" "}
                total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Partially Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                {expenses.filter((e) => e.status === "Partial").length}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                R
                {expenses
                  .filter((e) => e.status === "Partial")
                  .reduce((sum, e) => sum + e.remainingAmount, 0)
                  .toLocaleString()}{" "}
                remaining
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pending Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {
                  expenses.filter(
                    (e) => e.status === "Pending" || e.status === "Overdue"
                  ).length
                }
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                R
                {expenses
                  .filter(
                    (e) => e.status === "Pending" || e.status === "Overdue"
                  )
                  .reduce((sum, e) => sum + e.totalAmount, 0)
                  .toLocaleString()}{" "}
                due
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
