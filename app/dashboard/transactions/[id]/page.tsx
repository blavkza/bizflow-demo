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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Edit,
  Trash2,
  FileText,
  Calendar,
  Tag,
  User,
  CreditCard,
  Receipt,
} from "lucide-react";

export default function TransactionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Mock transaction data - in real app, fetch based on params.id
  const [transaction, setTransaction] = useState({
    id: params.id,
    date: "2024-01-15",
    description: "Office Supplies Purchase",
    amount: 1250.0,
    type: "Expense",
    category: "Office Supplies",
    subcategory: "Stationery",
    paymentMethod: "Credit Card",
    reference: "TXN-2024-001",
    vendor: "Office Depot Inc.",
    status: "Completed",
    notes:
      "Monthly office supplies order including paper, pens, and printer cartridges",
    receiptUrl: "/placeholder.svg?height=400&width=300",
    createdBy: "John Smith",
    approvedBy: "Sarah Johnson",
    tags: ["Office", "Monthly", "Supplies"],
    taxAmount: 125.0,
    netAmount: 1125.0,
    accountCode: "6001",
    projectCode: "PROJ-001",
  });

  const relatedTransactions = [
    {
      id: "TXN-2024-002",
      date: "2024-01-10",
      description: "Office Supplies Return",
      amount: -150.0,
      type: "Refund",
    },
    {
      id: "TXN-2023-245",
      date: "2023-12-15",
      description: "Office Supplies Purchase",
      amount: 1180.0,
      type: "Expense",
    },
    {
      id: "TXN-2023-198",
      date: "2023-11-15",
      description: "Office Supplies Purchase",
      amount: 1320.0,
      type: "Expense",
    },
  ];

  const auditLog = [
    {
      date: "2024-01-15 14:30",
      action: "Transaction Created",
      user: "John Smith",
      details: "Initial transaction entry",
    },
    {
      date: "2024-01-15 15:45",
      action: "Amount Updated",
      user: "John Smith",
      details: "Changed amount from $1200.00 to $1250.00",
    },
    {
      date: "2024-01-16 09:15",
      action: "Approved",
      user: "Sarah Johnson",
      details: "Transaction approved for processing",
    },
    {
      date: "2024-01-16 10:30",
      action: "Status Changed",
      user: "System",
      details: "Status changed to Completed",
    },
  ];

  const handleEditTransaction = (formData: FormData) => {
    console.log("Updating transaction:", formData);
    setIsEditDialogOpen(false);
  };

  const handleDeleteTransaction = () => {
    console.log("Deleting transaction:", transaction.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Transaction Details</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="related">Related</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            {/* Transaction Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full ${transaction.type === "Income" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}
                    >
                      {transaction.type === "Income" ? (
                        <ArrowUpRight className="h-6 w-6" />
                      ) : (
                        <ArrowDownLeft className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">
                        {transaction.description}
                      </CardTitle>
                      <CardDescription className="text-lg">
                        {transaction.type} • {transaction.reference}
                      </CardDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant={
                            transaction.status === "Completed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {transaction.status}
                        </Badge>
                        <Badge variant="outline">{transaction.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold ${transaction.type === "Income" ? "text-green-600" : "text-red-600"}`}
                    >
                      {transaction.type === "Income" ? "+" : "-"}$
                      {transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Net: ${transaction.netAmount.toLocaleString()} | Tax: $
                      {transaction.taxAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
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
                        <DialogTitle>Edit Transaction</DialogTitle>
                        <DialogDescription>
                          Update transaction information
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        action={handleEditTransaction}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                              id="description"
                              name="description"
                              defaultValue={transaction.description}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                              id="amount"
                              name="amount"
                              type="number"
                              step="0.01"
                              defaultValue={transaction.amount}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                            <Select name="type" defaultValue={transaction.type}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Income">Income</SelectItem>
                                <SelectItem value="Expense">Expense</SelectItem>
                                <SelectItem value="Transfer">
                                  Transfer
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select
                              name="category"
                              defaultValue={transaction.category}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Office Supplies">
                                  Office Supplies
                                </SelectItem>
                                <SelectItem value="Marketing">
                                  Marketing
                                </SelectItem>
                                <SelectItem value="Travel">Travel</SelectItem>
                                <SelectItem value="Utilities">
                                  Utilities
                                </SelectItem>
                                <SelectItem value="Software">
                                  Software
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="vendor">Vendor</Label>
                            <Input
                              id="vendor"
                              name="vendor"
                              defaultValue={transaction.vendor}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="paymentMethod">
                              Payment Method
                            </Label>
                            <Select
                              name="paymentMethod"
                              defaultValue={transaction.paymentMethod}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Credit Card">
                                  Credit Card
                                </SelectItem>
                                <SelectItem value="Bank Transfer">
                                  Bank Transfer
                                </SelectItem>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Check">Check</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">Notes</Label>
                          <Textarea
                            id="notes"
                            name="notes"
                            defaultValue={transaction.notes}
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Delete Transaction</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to delete this transaction? This
                          action cannot be undone.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsDeleteDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteTransaction}
                        >
                          Delete Transaction
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Transaction Information */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Transaction Info
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Date:</span>
                    <span className="text-sm font-medium">
                      {transaction.date}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Reference:
                    </span>
                    <span className="text-sm font-medium">
                      {transaction.reference}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Account Code:
                    </span>
                    <span className="text-sm font-medium">
                      {transaction.accountCode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Project:
                    </span>
                    <span className="text-sm font-medium">
                      {transaction.projectCode}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Payment Details
                  </CardTitle>
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Method:
                    </span>
                    <span className="text-sm font-medium">
                      {transaction.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Vendor:
                    </span>
                    <span className="text-sm font-medium">
                      {transaction.vendor}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Category:
                    </span>
                    <span className="text-sm font-medium">
                      {transaction.category}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Subcategory:
                    </span>
                    <span className="text-sm font-medium">
                      {transaction.subcategory}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Approval Info
                  </CardTitle>
                  <User className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Created By:
                    </span>
                    <span className="text-sm font-medium">
                      {transaction.createdBy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Approved By:
                    </span>
                    <span className="text-sm font-medium">
                      {transaction.approvedBy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status:
                    </span>
                    <Badge
                      variant={
                        transaction.status === "Completed"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes and Tags */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {transaction.notes}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {transaction.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="related" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Related Transactions</CardTitle>
                <CardDescription>
                  Transactions related to this vendor or category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatedTransactions.map((txn) => (
                      <TableRow key={txn.id}>
                        <TableCell className="font-medium">{txn.id}</TableCell>
                        <TableCell>{txn.date}</TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell>{txn.type}</TableCell>
                        <TableCell
                          className={
                            txn.amount < 0 ? "text-red-600" : "text-green-600"
                          }
                        >
                          ${Math.abs(txn.amount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            View
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
                <CardTitle>Transaction Documents</CardTitle>
                <CardDescription>
                  Receipts and supporting documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Receipt className="h-4 w-4" />
                      <span className="font-medium">Receipt</span>
                    </div>
                    <img
                      src={transaction.receiptUrl || "/placeholder.svg"}
                      alt="Receipt"
                      className="w-full h-48 object-cover rounded border"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline">
                        Download
                      </Button>
                      <Button size="sm" variant="outline">
                        View Full
                      </Button>
                    </div>
                  </div>
                  <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload additional documents
                    </p>
                    <Button size="sm">Choose Files</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Log</CardTitle>
                <CardDescription>
                  Complete history of changes to this transaction
                </CardDescription>
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
