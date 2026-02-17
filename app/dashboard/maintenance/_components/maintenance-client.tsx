"use client";

import { useState, useMemo } from "react";
import {
  Maintenance,
  ServiceMaintenanceStatus,
  MaintenanceType,
} from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import { MaintenanceForm } from "./maintenance-form";
import {
  Dialog,
  DialogContent,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { MaintenanceFilters } from "./MaintenanceFilters";
import { MaintenanceStats } from "./MaintenanceStats";
import { PaginationControls } from "@/components/PaginationControls";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

// Extend Maintenance to include client
type MaintenanceWithRelations = Maintenance & {
  client: { name: string | null; id: string };
  invoice?: { id: string; invoiceNumber: string } | null;
  recurringInvoice?: { id: string; description: string | null } | null;
};

interface MaintenanceClientProps {
  initialMaintenances: MaintenanceWithRelations[];
  clients: { id: string; name: string | null; company: string | null }[];
  invoices: {
    id: string;
    invoiceNumber: string;
    clientId: string;
    client: { id: string; name: string | null };
  }[];
  recurringInvoices: {
    id: string;
    description: string | null;
    clientId: string;
    client: { id: string; name: string | null };
  }[];
}

export default function MaintenanceClient({
  initialMaintenances,
  clients,
  invoices,
  recurringInvoices,
}: MaintenanceClientProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const router = useRouter();

  const filteredMaintenances = useMemo(() => {
    let result = [...initialMaintenances];

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter((m) => m.status === statusFilter);
    }

    // Type Filter
    if (typeFilter !== "all") {
      result = result.filter((m) => m.type === typeFilter);
    }

    // Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (m) =>
          m.location.toLowerCase().includes(term) ||
          m.client.name?.toLowerCase().includes(term),
      );
    }

    // Sorting
    if (sortOption === "newest") {
      result.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else if (sortOption === "oldest") {
      result.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );
    }

    return result;
  }, [initialMaintenances, searchTerm, statusFilter, typeFilter, sortOption]);

  const totalPages = Math.ceil(filteredMaintenances.length / itemsPerPage);
  const paginatedMaintenances = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredMaintenances.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMaintenances, currentPage, itemsPerPage]);

  const resetPagination = () => {
    setCurrentPage(1);
  };

  const getStatusBadgeVariant = (status: ServiceMaintenanceStatus) => {
    switch (status) {
      case ServiceMaintenanceStatus.COMPLETED:
        return "default";
      case ServiceMaintenanceStatus.IN_PROGRESS:
        return "secondary";
      case ServiceMaintenanceStatus.CANCELLED:
        return "destructive";
      default:
        return "outline";
    }
  };

  const getInvoiceType = (m: MaintenanceWithRelations) => {
    if (m.invoiceId) return <Badge variant="secondary">Regular</Badge>;
    if (m.recurringInvoiceId)
      return (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-800 hover:bg-purple-200"
        >
          Recurring
        </Badge>
      );
    return <span className="text-muted-foreground text-xs">None</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {" "}
          <div className="flex items-center">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Maintenance</h2>
            <p className="text-muted-foreground">
              Manage your service and maintenance records
            </p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Maintenance
            </Button>
          </DialogTrigger>
          <DialogContent className="overflow-y-auto lg:min-w-[800px] max-h-[90vh] sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add Maintenance</DialogTitle>
            </DialogHeader>
            <MaintenanceForm
              clients={clients}
              invoices={invoices}
              recurringInvoices={recurringInvoices}
              onSuccess={() => {
                setOpen(false);
                // In a real app, you might want to refresh the data here
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <MaintenanceStats maintenances={initialMaintenances} />

      <MaintenanceFilters
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        sortOption={sortOption}
        onSearchChange={(value) => {
          setSearchTerm(value);
          resetPagination();
        }}
        onStatusFilterChange={(value) => {
          setStatusFilter(value);
          resetPagination();
        }}
        onTypeFilterChange={(value) => {
          setTypeFilter(value);
          resetPagination();
        }}
        onSortOptionChange={(value) => {
          setSortOption(value);
          resetPagination();
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Management</CardTitle>
          <CardDescription>
            {filteredMaintenances.length} maintenance record(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Invoice Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMaintenances.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No maintenance records found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMaintenances.map((maintenance) => (
                  <TableRow
                    key={maintenance.id}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    <TableCell
                      className="font-medium"
                      onClick={() =>
                        router.push(`/dashboard/maintenance/${maintenance.id}`)
                      }
                    >
                      {format(new Date(maintenance.date), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell
                      onClick={() =>
                        router.push(`/dashboard/maintenance/${maintenance.id}`)
                      }
                    >
                      <Badge variant="outline">{maintenance.type}</Badge>
                    </TableCell>
                    <TableCell
                      onClick={() =>
                        router.push(`/dashboard/maintenance/${maintenance.id}`)
                      }
                    >
                      {maintenance.client.name || "N/A"}
                    </TableCell>
                    <TableCell
                      onClick={() =>
                        router.push(`/dashboard/maintenance/${maintenance.id}`)
                      }
                    >
                      {maintenance.location}
                    </TableCell>
                    <TableCell
                      onClick={() =>
                        router.push(`/dashboard/maintenance/${maintenance.id}`)
                      }
                    >
                      {getInvoiceType(maintenance)}
                    </TableCell>
                    <TableCell
                      onClick={() =>
                        router.push(`/dashboard/maintenance/${maintenance.id}`)
                      }
                    >
                      <Badge
                        variant={getStatusBadgeVariant(maintenance.status)}
                      >
                        {maintenance.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/maintenance/${maintenance.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredMaintenances.length > 0 && (
            <div className="mt-4">
              <PaginationControls
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                totalPages={totalPages}
                onItemsPerPageChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
