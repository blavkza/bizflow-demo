"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Download } from "lucide-react";
import TransactionForm from "./_components/Transaction-Form";
import { TransactionsSkeleton } from "./_components/TransactionsSkeleton";
import { PaymentMethod, TransactionType, TransferStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { ReceiptPDF } from "./_components/ReceiptPDF";
import axios from "axios";

type Transaction = {
  id: string;
  date: string;
  description: string;
  category?: { name: string } | null;
  type: TransactionType;
  amount: number;
  status: TransferStatus;
  method: PaymentMethod;
};

type CompanySettings = {
  name: string;
  address: string;
  contactNumber: string;
  // Add other settings fields as needed
};

export default function TransactionsPage() {
  const router = useRouter();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [companySettings, setCompanySettings] =
    useState<CompanySettings | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "INCOME" | "EXPENSE">(
    "all"
  );
  const [generatingReceiptId, setGeneratingReceiptId] = useState<string | null>(
    null
  );
  const receiptRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/transactions");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTransactions(data);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchTransactions();
    fetchCompanySettings();
  }, []);

  const handleDownloadReceipt = async (transactionId: string) => {
    const receiptRef = receiptRefs.current[transactionId];
    if (!receiptRef) return;

    setGeneratingReceiptId(transactionId);
    try {
      if (receiptRef) {
        receiptRef.style.position = "fixed";
        receiptRef.style.top = "0";
        receiptRef.style.left = "0";
        receiptRef.style.zIndex = "9999";
        receiptRef.style.visibility = "visible";
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(receiptRef as HTMLElement, {
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
      pdf.save(`receipt-${transactionId.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error("Receipt generation error:", error);
    } finally {
      if (receiptRef) {
        receiptRef.style.position = "absolute";
        receiptRef.style.visibility = "hidden";
      }
      setGeneratingReceiptId(null);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Check if matches search term (description or category)
      const matchesSearch =
        searchTerm === "" ||
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (transaction.category?.name &&
          transaction.category.name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      // Check if matches type filter
      const matchesType =
        typeFilter === "all" || transaction.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [transactions, searchTerm, typeFilter]);

  if (loading || loadingSettings) {
    return <TransactionsSkeleton />;
  }

  return (
    <div>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-lg font-semibold">Transactions</h1>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value: "all" | "INCOME" | "EXPENSE") =>
                setTypeFilter(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="INCOME">Income</SelectItem>
                <SelectItem value="EXPENSE">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full  ">
                <DialogHeader>
                  <DialogTitle>Add New Transaction</DialogTitle>
                  <DialogDescription>
                    Enter the details for the new financial transaction.
                  </DialogDescription>
                </DialogHeader>
                <TransactionForm
                  type="create"
                  onCancel={() => setIsAddDialogOpen(false)}
                  onSubmitSuccess={() => {
                    setIsAddDialogOpen(false);
                    fetchTransactions();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Complete record of all financial transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>{transaction.category?.name || "-"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === "INCOME"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={
                          transaction.type === "INCOME"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {transaction.type === "INCOME" ? "+" : "-"}R
                        {Math.abs(transaction.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.status === "COMPLETED"
                              ? "default"
                              : transaction.status === "PENDING"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadReceipt(transaction.id)}
                          disabled={generatingReceiptId === transaction.id}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {generatingReceiptId === transaction.id
                            ? "Generating..."
                            : "Receipt"}
                        </Button>
                        {companySettings && (
                          <ReceiptPDF
                            ref={(el) =>
                              (receiptRefs.current[transaction.id] = el)
                            }
                            transaction={transaction}
                            companySettings={companySettings}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      No transactions found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
