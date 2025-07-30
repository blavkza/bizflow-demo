import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  reference: string;
  detectedCategory?: string;
  category?: string;
  type: "income" | "expense" | "transfer";
}

interface TransactionRowProps {
  transaction: Transaction;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onCategoryUpdate: (id: string, category: string) => void;
  categories: string[];
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  isSelected,
  onSelect,
  onCategoryUpdate,
  categories,
}) => {
  const formatAmount = (amount: number) => {
    const formatted = Math.abs(amount).toFixed(2);
    return amount >= 0 ? `+$${formatted}` : `-$${formatted}`;
  };

  const getAmountColor = (amount: number, type: string) => {
    if (type === "income" || amount > 0) return "text-income";
    if (type === "expense" || amount < 0) return "text-expense";
    return "text-transfer";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b border-border hover:bg-muted/50 transition-colors",
        isSelected && "bg-accent/30 border-accent"
      )}
    >
      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) =>
                onSelect(transaction.id, checked as boolean)
              }
            />
            <div>
              <p className="font-medium text-foreground">
                {transaction.description}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(transaction.date)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "font-semibold",
                getAmountColor(transaction.amount, transaction.type)
              )}
            >
              {formatAmount(transaction.amount)}
            </p>
          </div>
        </div>

        <div className="space-y-2 ml-8">
          <p className="text-sm text-muted-foreground">
            Ref: {transaction.reference}
          </p>

          {transaction.detectedCategory && (
            <Badge variant="secondary" className="text-xs">
              Detected: {transaction.detectedCategory}
            </Badge>
          )}

          <Select
            value={transaction.category || ""}
            onValueChange={(value) => onCategoryUpdate(transaction.id, value)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:contents">
        {/* Checkbox */}
        <div className="flex items-center">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) =>
              onSelect(transaction.id, checked as boolean)
            }
          />
        </div>

        {/* Date */}
        <div className="col-span-1 flex items-center">
          <span className="text-sm text-muted-foreground">
            {formatDate(transaction.date)}
          </span>
        </div>

        {/* Description */}
        <div className="col-span-3 flex items-center">
          <div>
            <p className="font-medium text-foreground truncate">
              {transaction.description}
            </p>
            {transaction.detectedCategory && (
              <Badge variant="secondary" className="text-xs mt-1">
                Detected: {transaction.detectedCategory}
              </Badge>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="col-span-2 flex items-center justify-end">
          <span
            className={cn(
              "font-semibold",
              getAmountColor(transaction.amount, transaction.type)
            )}
          >
            {formatAmount(transaction.amount)}
          </span>
        </div>

        {/* Reference */}
        <div className="col-span-2 flex items-center">
          <span className="text-sm text-muted-foreground truncate">
            {transaction.reference}
          </span>
        </div>

        {/* Category Selection */}
        <div className="col-span-3 flex items-center">
          <Select
            value={transaction.category || ""}
            onValueChange={(value) => onCategoryUpdate(transaction.id, value)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
