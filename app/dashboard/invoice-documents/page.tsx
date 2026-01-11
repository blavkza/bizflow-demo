"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Header from "./_components/Header";
import { useEffect, useState } from "react";
import axios from "axios";
import { InvoiceDocumentWithRelations } from "@/types/invoice-document";
import InvoiceDocumentsLoading from "./_components/loading";
import { UserPermission, UserRole } from "@prisma/client";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { InvoiceDocumentTable } from "./_components/InvoiceDocumentTable";
import { InvoiceDocumentStats } from "./_components/InvoiceDocumentStats";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

async function fetchUserData(userId: string) {
  const response = await fetch(`/api/users/userId/${userId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch user data");
  }
  return response.json();
}

const hasRole = (role: string, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(role as UserRole);
};

// Document type options
const DOCUMENT_TYPE_OPTIONS = [
  { value: "all", label: "All Documents" },
  { value: "DELIVERY_NOTE", label: "Delivery Notes" },
  { value: "PURCHASE_ORDER", label: "Purchase Orders" },
  { value: "PRO_FORMA_INVOICE", label: "Pro Forma Invoices" },
  { value: "CREDIT_NOTE", label: "Credit Notes" },
  { value: "SUPPLIER_LIST", label: "Supplier Lists" },
  { value: "INVOICE", label: "Invoices" },
];

// Status options
const DOCUMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "PAID", label: "Paid" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "CANCELLED", label: "Cancelled" },
];

// Sort options
const DOCUMENT_SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "amount-high", label: "Amount: High to Low" },
  { value: "amount-low", label: "Amount: Low to High" },
  { value: "due-date", label: "Due Date" },
];

// Create a separate component that uses useSearchParams
function InvoiceDocumentsContent() {
  const [documents, setDocuments] = useState<InvoiceDocumentWithRelations[]>(
    []
  );
  const [filteredDocuments, setFilteredDocuments] = useState<
    InvoiceDocumentWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [documentTypeFilter, setDocumentTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();
  const { userId } = useAuth();
  const searchParams = useSearchParams(); // Now safely wrapped in Suspense

  const { data, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUserData(userId!),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const fullAccessRoles = [UserRole.CHIEF_EXECUTIVE_OFFICER];
  const hasFullAccess = data?.role
    ? hasRole(data?.role, fullAccessRoles)
    : false;

  const canViewDocuments = data?.permissions?.includes(
    UserPermission.INVOICES_VIEW
  );

  const canCreateDocuments = data?.permissions?.includes(
    UserPermission.INVOICES_CREATE
  );

  // Get document type from URL query parameter
  useEffect(() => {
    const typeFromUrl = searchParams.get("type");
    if (typeFromUrl) {
      // Convert URL param to enum value
      const typeMap: Record<string, string> = {
        "delivery-note": "DELIVERY_NOTE",
        "purchase-order": "PURCHASE_ORDER",
        "pro-forma-invoice": "PRO_FORMA_INVOICE",
        "credit-note": "CREDIT_NOTE",
        "supplier-list": "SUPPLIER_LIST",
        invoice: "INVOICE",
      };
      setDocumentTypeFilter(typeMap[typeFromUrl] || "all");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isLoading && canViewDocuments === false && hasFullAccess === false) {
      router.push("/dashboard");
    }
  }, [isLoading, canViewDocuments, hasFullAccess, router]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await axios.get<InvoiceDocumentWithRelations[]>(
          "/api/invoices/documents"
        );
        setDocuments(response.data);
        setFilteredDocuments(response.data);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let results = [...documents];

    // Apply document type filter
    if (documentTypeFilter !== "all") {
      results = results.filter(
        (doc) => doc.invoiceDocumentType === documentTypeFilter
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      results = results.filter((doc) => doc.status === statusFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (doc) =>
          doc.invoiceDocumentNumber?.toLowerCase().includes(query) ||
          doc.client?.name?.toLowerCase().includes(query) ||
          doc.supplier?.name?.toLowerCase().includes(query) ||
          doc.referenceNumber?.toLowerCase().includes(query) ||
          doc.notes?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    switch (sortOption) {
      case "newest":
        results.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        results.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "amount-high":
        results.sort((a, b) => Number(b.totalAmount) - Number(a.totalAmount));
        break;
      case "amount-low":
        results.sort((a, b) => Number(a.totalAmount) - Number(b.totalAmount));
        break;
      case "due-date":
        results.sort((a, b) => {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return dateA - dateB;
        });
        break;
      default:
        break;
    }

    setFilteredDocuments(results);
  }, [documents, documentTypeFilter, statusFilter, sortOption, searchQuery]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleDocumentTypeChange = (value: string) => {
    setDocumentTypeFilter(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
  };

  const getDocumentTypeLabel = (type: string) => {
    const option = DOCUMENT_TYPE_OPTIONS.find((opt) => opt.value === type);
    return option?.label || type;
  };

  if (loading) {
    return <InvoiceDocumentsLoading />;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
      <Header
        documentType={documentTypeFilter}
        canCreateDocuments={canCreateDocuments}
        hasFullAccess={hasFullAccess}
      />

      <InvoiceDocumentStats
        documents={documents}
        documentTypeFilter={documentTypeFilter}
      />

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-2 mt-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by document number, client, supplier, or reference..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>

        <div className="flex gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort Option */}
          <Select value={sortOption} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Quick Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Quick Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setStatusFilter("DRAFT");
                  setDocumentTypeFilter("all");
                }}
              >
                All Drafts
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setStatusFilter("OVERDUE");
                  setDocumentTypeFilter("all");
                }}
              >
                Overdue Documents
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setStatusFilter("all");
                  setDocumentTypeFilter("DELIVERY_NOTE");
                }}
              >
                Only Delivery Notes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setStatusFilter("all");
                  setDocumentTypeFilter("PURCHASE_ORDER");
                }}
              >
                Only Purchase Orders
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setStatusFilter("all");
                  setSortOption("due-date");
                }}
              >
                Sort by Due Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {documentTypeFilter === "all"
              ? "All Documents"
              : `${getDocumentTypeLabel(documentTypeFilter)} (${filteredDocuments.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <InvoiceDocumentTable
            documents={filteredDocuments}
            canCreateDocuments={canCreateDocuments || hasFullAccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Main page component with Suspense
export default function InvoiceDocumentsPage() {
  return (
    <Suspense fallback={<InvoiceDocumentsLoading />}>
      <InvoiceDocumentsContent />
    </Suspense>
  );
}
