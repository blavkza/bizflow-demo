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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DollarSign,
  Building,
  FileText,
  CreditCard,
  Plus,
  Download,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";

export default function ExpenseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Mock expense data
  const expense = {
    id: params.id,
    description: "IT Equipment Purchase",
    category: "Technology",
    vendor: "Tech Suppliers Ltd",
    vendorEmail: "billing@techsuppliers.com",
    vendorPhone: "+27 11 234 5678",
    totalAmount: 45000,
    paidAmount: 20000,
    remainingAmount: 25000,
    status: "Partial",
    dueDate: "2024-01-15",
    createdDate: "2023-12-20",
    paymentMethod: "Credit",
    priority: "Medium",
    accountCode: "5200",
    projectCode: "PROJ-002",
    approvedBy: "Sarah Johnson",
    notes:
      "Purchase of 5 new laptops for development team. First payment made on delivery, second payment due in 30 days.",
    attachments: [
      { name: "invoice.pdf", size: "245 KB", type: "PDF" },
      { name: "purchase_order.pdf", size: "128 KB", type: "PDF" },
    ],
  };

  const paymentHistory = [
    {
      id: "PAY001",
      date: "2024-01-03",
      amount: 20000,
      method: "Bank Transfer",
      reference: "TXN-20240103-001",
      status: "Completed",
      paidBy: "John Smith",
      notes: "Initial payment on delivery",
    },
  ];

  const upcomingPayments = [
    {
      id: "UP001",
      dueDate: "2024-01-15",
      amount: 25000,
      description: "Final payment for IT equipment",
      status: "Scheduled",
    },
  ];

  const relatedExpenses = [
    {
      id: "EXP007",
      description: "IT Equipment Maintenance",
      vendor: "Tech Suppliers Ltd",
      amount: 3500,
      status: "Pending",
    },
    {
      id: "EXP008",
      description: "Software Licenses",
      vendor: "Tech Suppliers Ltd",
      amount: 12000,
      status: "Paid",
    },
  ];

  const auditLog = [
    {
      date: "2024-01-03 14:30",
      action: "Payment Recorded",
      user: "John Smith",
      details: "Recorded payment of R20,000",
    },
    {
      date: "2023-12-22 09:15",
      action: "Expense Approved",
      user: "Sarah Johnson",
      details: "Expense approved for payment",
    },
    {
      date: "2023-12-20 16:45",
      action: "Expense Created",
      user: "John Smith",
      details: "Initial expense entry",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
      case "Completed":
        return "default";
      case "Partial":
      case "Scheduled":
        return "secondary";
      case "Pending":
        return "outline";
      case "Overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const paymentProgress = (expense.paidAmount / expense.totalAmount) * 100;

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Expense Details</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="related">Related</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Expense Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-2xl">
                        {expense.description}
                      </CardTitle>
                      <Badge variant={getStatusColor(expense.status)}>
                        {expense.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {expense.id} • {expense.category} • Due: {expense.dueDate}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      R{expense.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Amount
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Dialog
                    open={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Record Payment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                          Add a new payment for this expense
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="amount" className="text-right">
                            Amount
                          </Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            className="col-span-3"
                            max={expense.remainingAmount}
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="date" className="text-right">
                            Date
                          </Label>
                          <div className="col-span-3">
                            <DatePicker />
                          </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="method" className="text-right">
                            Method
                          </Label>
                          <Select>
                            <SelectTrigger className="col-span-3">
                              <SelectValue placeholder="Payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank">
                                Bank Transfer
                              </SelectItem>
                              <SelectItem value="card">Credit Card</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="reference" className="text-right">
                            Reference
                          </Label>
                          <Input
                            id="reference"
                            placeholder="Transaction reference"
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="paymentNotes" className="text-right">
                            Notes
                          </Label>
                          <Textarea
                            id="paymentNotes"
                            placeholder="Payment notes..."
                            className="col-span-3"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsPaymentDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => setIsPaymentDialogOpen(false)}>
                          Record Payment
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isEditDialogOpen}
                    onOpenChange={setIsEditDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                        <DialogDescription>
                          Update expense information
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Input defaultValue={expense.description} />
                          </div>
                          <div className="space-y-2">
                            <Label>Vendor</Label>
                            <Input defaultValue={expense.vendor} />
                          </div>
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select defaultValue={expense.category}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Technology">
                                  Technology
                                </SelectItem>
                                <SelectItem value="Marketing">
                                  Marketing
                                </SelectItem>
                                <SelectItem value="Rent">Rent</SelectItem>
                                <SelectItem value="Supplies">
                                  Supplies
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select defaultValue={expense.priority}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Low">Low</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="High">High</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={() => setIsEditDialogOpen(false)}>
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Payment Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Progress</CardTitle>
                <CardDescription>Track payment completion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Paid</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      R{expense.paidAmount.toLocaleString()}
                    </div>
                    <Progress value={paymentProgress} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Remaining</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">
                      R{expense.remainingAmount.toLocaleString()}
                    </div>
                    <Progress value={100 - paymentProgress} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Total</span>
                    </div>
                    <div className="text-2xl font-bold">
                      R{expense.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {paymentProgress.toFixed(1)}% Complete
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expense Information */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Expense Info
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Created:
                    </span>
                    <span className="text-sm font-medium">
                      {expense.createdDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Due Date:
                    </span>
                    <span className="text-sm font-medium">
                      {expense.dueDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Priority:
                    </span>
                    <Badge variant="outline">{expense.priority}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status:
                    </span>
                    <Badge variant={getStatusColor(expense.status)}>
                      {expense.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Vendor Details
                  </CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">
                      {expense.vendor}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Email:
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {expense.vendorEmail}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Phone:
                    </span>
                    <span className="text-sm font-medium">
                      {expense.vendorPhone}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Accounting
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Account Code:
                    </span>
                    <span className="text-sm font-medium">
                      {expense.accountCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Project:
                    </span>
                    <span className="text-sm font-medium">
                      {expense.projectCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Approved By:
                    </span>
                    <span className="text-sm font-medium">
                      {expense.approvedBy}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{expense.notes}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  All payments made for this expense
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Paid By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentHistory.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          R{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>{payment.method}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {payment.reference}
                        </TableCell>
                        <TableCell>{payment.paidBy}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.notes}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Upcoming Payments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Payments</CardTitle>
                <CardDescription>
                  Scheduled and pending payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.dueDate}
                        </TableCell>
                        <TableCell>{payment.description}</TableCell>
                        <TableCell className="font-bold">
                          R{payment.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(payment.status)}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Pay Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
                <CardDescription>
                  Documents related to this expense
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {expense.attachments.map((doc, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {doc.type} • {doc.size}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload documents
                    </p>
                    <Button size="sm">Choose Files</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="related" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Related Expenses</CardTitle>
                <CardDescription>
                  Other expenses from the same vendor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedExpenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="font-medium">{exp.id}</TableCell>
                        <TableCell>{exp.description}</TableCell>
                        <TableCell>{exp.vendor}</TableCell>
                        <TableCell className="font-medium">
                          R{exp.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(exp.status)}>
                            {exp.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Link href={`/expenses/${exp.id}`}>
                            <Button variant="ghost" size="sm">
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>Complete history of changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLog.map((entry, index) => (
                    <div
                      key={index}
                      className="flex gap-4 pb-4 border-b last:border-b-0"
                    >
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{entry.action}</span>
                          <span className="text-sm text-muted-foreground">
                            {entry.date}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {entry.details}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          by {entry.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarInset>
  );
}
