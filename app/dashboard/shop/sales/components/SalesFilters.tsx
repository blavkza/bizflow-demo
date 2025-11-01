import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const statusConfig = {
  COMPLETED: { label: "Completed" },
  REFUNDED: { label: "Refunded" },
  PARTIALLY_REFUNDED: { label: "Partial Refund" },
  CANCELLED: { label: "Cancelled" },
  PENDING: { label: "Pending" },
};

interface SalesFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
}

export default function SalesFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
}: SalesFiltersProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search sales by number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sale Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              {Object.entries(statusConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  {config.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={onPaymentFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Payment Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Methods</SelectItem>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="CREDIT_CARD">Credit Card</SelectItem>
              <SelectItem value="DEBIT_CARD">Debit Card</SelectItem>
              <SelectItem value="EFT">EFT</SelectItem>
              <SelectItem value="MOBILE_PAYMENT">Mobile Payment</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
