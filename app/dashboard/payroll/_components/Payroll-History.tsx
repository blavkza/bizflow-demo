"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  Eye,
  Download,
  Calendar,
  DollarSign,
  Users,
  Search,
  Filter,
} from "lucide-react";
import { PayrollStatus } from "@prisma/client";
import { PaginationControls } from "@/components/PaginationControls";
import { formatCurrency } from "../utils";
import { useRouter } from "next/navigation";
import { Payroll } from "@/types/payroll"; // Import from your types file

interface PayrollHistoryProps {
  initialPayrolls: Payroll[]; // Use the imported Payroll type
  fetchPayrolls: () => void;
  hasFullAccess: boolean;
  canManagePayroll: boolean;
}

export default function PayrollHistory({
  initialPayrolls,
  fetchPayrolls,
  hasFullAccess,
  canManagePayroll,
}: PayrollHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const router = useRouter();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter payrolls on client-side
  const filteredPayrolls = useMemo(() => {
    return initialPayrolls.filter((payroll) => {
      // Search filter
      const matchesSearch =
        payroll.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payroll.transaction.reference
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        payroll.month.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const matchesStatus =
        statusFilter === "all" || payroll.status === statusFilter;

      // Month filter
      const matchesMonth =
        monthFilter === "all" || payroll.month.endsWith(`-${monthFilter}`);

      // Year filter
      const matchesYear =
        yearFilter === "all" || payroll.month.startsWith(`${yearFilter}-`);

      return matchesSearch && matchesStatus && matchesMonth && matchesYear;
    });
  }, [initialPayrolls, searchTerm, statusFilter, monthFilter, yearFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPayrolls = filteredPayrolls.slice(startIndex, endIndex);

  // Calculate stats - convert Decimal to number for calculations
  const stats = useMemo(() => {
    const totalAmount = filteredPayrolls.reduce(
      (sum, payroll) => sum + Number(payroll.totalAmount),
      0
    );

    const totalBaseAmount = filteredPayrolls.reduce(
      (sum, payroll) => sum + Number(payroll.baseAmount),
      0
    );

    const totalOvertimeAmount = filteredPayrolls.reduce(
      (sum, payroll) => sum + Number(payroll.overtimeAmount),
      0
    );

    const statusCounts = filteredPayrolls.reduce(
      (acc, payroll) => {
        acc[payroll.status] = (acc[payroll.status] || 0) + 1;
        return acc;
      },
      {} as Record<PayrollStatus, number>
    );

    return { totalAmount, totalBaseAmount, totalOvertimeAmount, statusCounts };
  }, [filteredPayrolls]);

  // Get unique months and years for filters
  const { uniqueMonths, uniqueYears } = useMemo(() => {
    const months = new Set<string>();
    const years = new Set<string>();

    initialPayrolls.forEach((payroll) => {
      const [year, month] = payroll.month.split("-");
      months.add(month);
      years.add(year);
    });

    return {
      uniqueMonths: Array.from(months).sort(),
      uniqueYears: Array.from(years).sort((a, b) => parseInt(b) - parseInt(a)),
    };
  }, [initialPayrolls]);

  const getStatusVariant = (status: PayrollStatus) => {
    switch (status) {
      case "PROCESSED":
        return "default";
      case "PAID":
        return "secondary";
      case "DRAFT":
        return "outline";
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
  };

  const handleViewPayroll = (payrollId: string) => {
    router.push(`/dashboard/payroll/details/${payrollId}`);
  };

  const handleDownloadReport = async (payrollId: string) => {
    try {
      // Implement download functionality
      console.log("Download payroll:", payrollId);
    } catch (error) {
      console.error("Failed to download payroll:", error);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    setCurrentPage(1);
  };

  // Generate month options with labels
  const monthOptions = [
    { value: "all", label: "All Months" },
    ...uniqueMonths.map((month) => {
      const monthNum = parseInt(month);
      const monthName = new Date(2000, monthNum - 1, 1).toLocaleDateString(
        "en-US",
        { month: "long" }
      );
      return { value: month, label: monthName };
    }),
  ];

  // Generate year options
  const yearOptions = [
    { value: "all", label: "All Years" },
    ...uniqueYears.map((year) => ({ value: year, label: year })),
  ];

  if (initialPayrolls.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <DollarSign className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="text-lg font-medium">No Payroll History</h3>
              <p className="text-sm text-muted-foreground">
                Process your first payroll to see it here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Processed
                </p>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Base Amount
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.totalBaseAmount)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overtime
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.totalOvertimeAmount)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Payrolls
                </p>
                <p className="text-2xl font-bold">{filteredPayrolls.length}</p>
                <p className="text-xs text-muted-foreground">
                  of {initialPayrolls.length} total
                </p>
              </div>
              <Filter className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Filter payroll history by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search by description, reference, or month..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2"
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PROCESSED">Processed</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchTerm ||
            statusFilter !== "all" ||
            monthFilter !== "all" ||
            yearFilter !== "all") && (
            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {filteredPayrolls.length} of {initialPayrolls.length}{" "}
                payrolls
              </p>
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
          <CardDescription>
            View and manage all processed payrolls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payroll Period</TableHead>
                <TableHead>Workers</TableHead>
                <TableHead>Base Amount</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Processed Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPayrolls.map((payroll) => (
                <TableRow key={payroll.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {formatMonth(payroll.month)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {payroll._count.payments} workers
                    </div>
                  </TableCell>
                  <TableCell className="text-blue-600 font-medium">
                    {formatCurrency(Number(payroll.baseAmount))}
                  </TableCell>
                  <TableCell className="text-orange-600 font-medium">
                    {formatCurrency(Number(payroll.overtimeAmount))}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(Number(payroll.totalAmount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(payroll.status)}>
                      {payroll.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(payroll.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {payroll.transaction.reference}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPayroll(payroll.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReport(payroll.id)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Report
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {paginatedPayrolls.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payrolls found matching your criteria</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          )}

          {/* Pagination Controls */}
          {paginatedPayrolls.length > 0 && (
            <PaginationControls
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              totalPages={totalPages}
              onItemsPerPageChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
              onPageChange={setCurrentPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
