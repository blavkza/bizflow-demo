import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import TransactionCeoForm from "./Transaction-Form";
import { TransactionCeo, CategoryCeo, TransactionType } from "@prisma/client";

type TransactionWithCategory = TransactionCeo & {
  CategoryCeo?: {
    id: string;
    name: string;
    type: string;
  } | null;
};

interface TransactionManagerProps {
  transactions: TransactionWithCategory[];
  categories: CategoryCeo[];
  fetchData: () => Promise<void> | void;
}

const TransactionManager = ({
  transactions,
  categories,
  fetchData,
}: TransactionManagerProps) => {
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionWithCategory[]
  >([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<TransactionWithCategory | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [type, setType] = useState<TransactionType | "all">("all");
  const itemsPerPage = 10;

  useEffect(() => {
    const filtered = transactions.filter(
      (t) => type === "all" || t.type === type
    );
    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [type, transactions]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/transactionsCeo/${id}`);
      toast.success("Transaction deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction");
    }
  };

  const handleEdit = (transaction: TransactionWithCategory) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const renderPaginationItems = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (totalPages > maxVisiblePages) {
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pages;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Transaction Management
          </h2>
          <p className="text-muted-foreground">
            Add and manage your financial transactions
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingTransaction(null);
          }}
        >
          <DialogTrigger asChild>
            <Button variant={"outline"}>
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTransaction
                  ? "Edit Transaction"
                  : "Add New Transaction"}
              </DialogTitle>
              <DialogDescription>
                {editingTransaction
                  ? "Update the transaction details below."
                  : "Enter the details for the new financial transaction."}
              </DialogDescription>
            </DialogHeader>
            <TransactionCeoForm
              type={editingTransaction ? "update" : "create"}
              data={editingTransaction || undefined}
              onCancel={() => {
                setIsDialogOpen(false);
                setEditingTransaction(null);
              }}
              onSubmitSuccess={() => {
                setIsDialogOpen(false);
                setEditingTransaction(null);
                fetchData();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-4">
        <div className="w-full max-w-xs">
          <Label htmlFor="type">Transaction Type</Label>
          <Select
            value={type}
            onValueChange={(value: TransactionType | "all") => {
              setType(value);
            }}
          >
            <SelectTrigger id="type" className="w-full">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value={TransactionType.INCOME}>Income</SelectItem>
              <SelectItem value={TransactionType.EXPENSE}>Expense</SelectItem>
              <SelectItem value={TransactionType.TRANSFER}>Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No transactions found. Add your first transaction to get
                  started.
                </TableCell>
              </TableRow>
            ) : (
              currentTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {transaction.type === TransactionType.INCOME ? (
                        <ArrowUpRight className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-destructive" />
                      )}
                      <Badge
                        variant={
                          transaction.type === TransactionType.INCOME
                            ? "default"
                            : "secondary"
                        }
                      >
                        {transaction.type.toLowerCase()}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {transaction.description}
                  </TableCell>
                  <TableCell>
                    {transaction.CategoryCeo ? (
                      <Badge variant="outline">
                        {transaction.CategoryCeo.name}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Uncategorized</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      transaction.type === TransactionType.INCOME
                        ? "text-success"
                        : "text-destructive"
                    }`}
                  >
                    {transaction.type === TransactionType.EXPENSE && "-"}R
                    {Number(transaction.amount).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(transaction)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (
                            confirm(
                              "Are you sure you want to delete this transaction?"
                            )
                          ) {
                            handleDelete(transaction.id);
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredTransactions.length > itemsPerPage && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, filteredTransactions.length)} of{" "}
            {filteredTransactions.length} transactions
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default TransactionManager;
