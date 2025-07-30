import React, { useState, useMemo } from "react";
import { Search, Filter, Download, Check, Tag, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionRow, Transaction } from "./TransactionRow";
import { cn } from "@/lib/utils";

interface TransactionTableProps {
  transactions: Transaction[];
  onTransactionUpdate: (transactions: Transaction[]) => void;
}

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Bills & Utilities",
  "Healthcare",
  "Travel",
  "Education",
  "Business",
  "Income",
  "Transfer",
  "Other",
];

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onTransactionUpdate,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );

  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (transaction) =>
        transaction.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.reference
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.category
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        transaction.detectedCategory
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  const handleSelectTransaction = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredTransactions.map((t) => t.id)));
    }
  };

  const handleCategoryUpdate = (id: string, category: string) => {
    const updatedTransactions = transactions.map((transaction) =>
      transaction.id === id ? { ...transaction, category } : transaction
    );
    onTransactionUpdate(updatedTransactions);
  };

  const handleBulkCategorize = (category: string) => {
    const updatedTransactions = transactions.map((transaction) =>
      selectedTransactions.has(transaction.id)
        ? { ...transaction, category }
        : transaction
    );
    onTransactionUpdate(updatedTransactions);
    setSelectedTransactions(new Set());
  };

  const handleMarkAsReviewed = () => {
    // In a real app, this would mark transactions as reviewed
    console.log("Marking as reviewed:", Array.from(selectedTransactions));
    setSelectedTransactions(new Set());
  };

  const handleBulkDelete = () => {
    const updatedTransactions = transactions.filter(
      (transaction) => !selectedTransactions.has(transaction.id)
    );
    onTransactionUpdate(updatedTransactions);
    setSelectedTransactions(new Set());
  };

  const totalAmount = filteredTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );
  const selectedCount = selectedTransactions.size;

  return (
    <Card className="w-full">
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-xl font-semibold">
            Bank Statement Transactions
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {filteredTransactions.length} transactions
            </Badge>
            <Badge
              variant={totalAmount >= 0 ? "default" : "destructive"}
              className="text-sm"
            >
              Total: {totalAmount >= 0 ? "+" : ""}$
              {Math.abs(totalAmount).toFixed(2)}
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 p-3 bg-accent/20 rounded-lg border">
            <span className="text-sm text-accent-strong font-medium">
              {selectedCount} selected
            </span>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkCategorize("Food & Dining")}
                className="h-7"
              >
                <Tag className="h-3 w-3 mr-1" />
                Food
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkCategorize("Transportation")}
                className="h-7"
              >
                <Tag className="h-3 w-3 mr-1" />
                Transport
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkCategorize("Shopping")}
                className="h-7"
              >
                <Tag className="h-3 w-3 mr-1" />
                Shopping
              </Button>
              <Button size="sm" onClick={handleMarkAsReviewed} className="h-7">
                <Check className="h-3 w-3 mr-1" />
                Mark Reviewed
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                className="h-7"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        )}

        {/* Desktop Table Header */}
        <div className="hidden md:grid md:grid-cols-12 gap-4 py-3 px-4 bg-muted/50 rounded-lg text-sm font-medium text-muted-foreground">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={
                selectedTransactions.size === filteredTransactions.length &&
                filteredTransactions.length > 0
              }
              onChange={handleSelectAll}
              className="rounded border-border"
            />
          </div>
          <div className="col-span-1">Date</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2">Reference</div>
          <div className="col-span-3">Category</div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="space-y-0">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No transactions found</p>
              {searchTerm && (
                <p className="text-sm mt-2">Try adjusting your search terms</p>
              )}
            </div>
          ) : (
            filteredTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                isSelected={selectedTransactions.has(transaction.id)}
                onSelect={handleSelectTransaction}
                onCategoryUpdate={handleCategoryUpdate}
                categories={CATEGORIES}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
