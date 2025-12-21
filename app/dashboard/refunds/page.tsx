"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  Download,
  RefreshCw,
  Loader2,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { SalesLoadingSkeleton } from "./SalesLoadingSkeleton";

interface Refund {
  id: string;
  refundNumber: string;
  status: string;
  reason: string;
  method: string;
  amount: number;
  taxAmount: number;
  requestedBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  sale: {
    id: string;
    saleNumber: string;
    customerName: string | null;
    total: number;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    saleItem: {
      ShopProduct: {
        name: string;
        sku: string;
      };
    };
  }>;
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    badgeColor: "bg-yellow-500",
  },
  APPROVED: {
    label: "Approved",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    badgeColor: "bg-blue-500",
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    badgeColor: "bg-red-500",
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    badgeColor: "bg-green-500",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    badgeColor: "bg-gray-500",
  },
};

const methodConfig = {
  ORIGINAL_METHOD: "Original Method",
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  BANK_TRANSFER: "Bank Transfer",
  STORE_CREDIT: "Store Credit",
};

export default function RefundsPage() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [methodFilter, setMethodFilter] = useState("All");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/refunds");

      if (!response.ok) {
        throw new Error("Failed to fetch refunds");
      }

      const data = await response.json();
      setRefunds(data.data || []);
    } catch (error) {
      console.error("Error fetching refunds:", error);
      toast({
        title: "Error",
        description: "Failed to load refunds data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const filteredRefunds = refunds
    .filter((refund) => {
      const matchesSearch =
        refund.refundNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.sale.saleNumber
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (refund.sale.customerName &&
          refund.sale.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === "All" || refund.status === statusFilter;

      const matchesMethod =
        methodFilter === "All" || refund.method === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField as keyof Refund];
      let bValue: any = b[sortField as keyof Refund];

      if (sortField === "sale") {
        aValue = a.sale.saleNumber;
        bValue = b.sale.saleNumber;
      } else if (sortField === "amount") {
        aValue = Number(a.amount);
        bValue = Number(b.amount);
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleExport = async () => {
    try {
      const response = await fetch("/api/refunds/export");
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `refunds-export-${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: "Export Successful",
          description: "Refunds data has been exported",
        });
      } else {
        throw new Error("Export failed");
      }
    } catch (error) {
      console.error("Error exporting refunds:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export refunds data",
        variant: "destructive",
      });
    }
  };

  const getTotalRefunds = () => {
    return filteredRefunds.reduce(
      (sum, refund) => sum + Number(refund.amount),
      0
    );
  };

  const getStatusCount = (status: string) => {
    return refunds.filter((refund) => refund.status === status).length;
  };

  if (loading) {
    return <SalesLoadingSkeleton />;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Refunds Management
        </h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={fetchRefunds}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refunds.length}</div>
            <p className="text-xs text-muted-foreground">All refund requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R{getTotalRefunds().toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Refunded amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getStatusCount("PENDING")}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getStatusCount("APPROVED")}
            </div>
            <p className="text-xs text-muted-foreground">Ready to process</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getStatusCount("COMPLETED")}
            </div>
            <p className="text-xs text-muted-foreground">Processed refunds</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by refund number, sale number, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
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
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Methods</SelectItem>
                {Object.entries(methodConfig).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Refunds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Refund Requests ({filteredRefunds.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRefunds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {refunds.length === 0
                  ? "No refunds found"
                  : "No refunds match your filters"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("refundNumber")}
                      className="p-0 hover:bg-transparent"
                    >
                      Refund #
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("sale")}
                      className="p-0 hover:bg-transparent"
                    >
                      Sale #
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("amount")}
                      className="p-0 hover:bg-transparent"
                    >
                      Amount
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("createdAt")}
                      className="p-0 hover:bg-transparent"
                    >
                      Requested
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRefunds.map((refund) => {
                  const statusConfigItem =
                    statusConfig[refund.status as keyof typeof statusConfig];

                  return (
                    <TableRow key={refund.id}>
                      <TableCell className="font-medium">
                        {refund.refundNumber}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/shop/sales/${refund.sale.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {refund.sale.saleNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {refund.sale.customerName || "Walk-in Customer"}
                      </TableCell>

                      <TableCell>
                        {
                          methodConfig[
                            refund.method as keyof typeof methodConfig
                          ]
                        }
                      </TableCell>
                      <TableCell className="font-semibold">
                        R{Number(refund.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={statusConfigItem.color}
                          variant="outline"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${statusConfigItem.badgeColor} mr-2`}
                          />
                          {statusConfigItem.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(refund.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          className="flex items-center "
                          href={`/dashboard/refunds/${refund.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Link>
                        {/*   <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {refund.status === "PENDING" && (
                              <>
                                <DropdownMenuItem className="text-green-600">
                                  Approve Refund
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Reject Refund
                                </DropdownMenuItem>
                              </>
                            )}
                            {refund.status === "APPROVED" && (
                              <DropdownMenuItem className="text-blue-600">
                                Process Refund
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu> */}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
