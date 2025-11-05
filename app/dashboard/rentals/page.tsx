"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import RentalStats from "./components/rental-stats";
import RentalFilters from "./components/rental-filters";
import RentalsTable from "./components/rentals-table";
import CreateRentalDialog from "./components/create-rental-dialog";
import EmptyState from "./components/empty-state";
import { Client, ComboboxOption, Tool, ToolRental } from "./types";

export default function ToolRentalsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("All");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [rentals, setRentals] = useState<ToolRental[]>([]);
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsOptions, setClientsOptions] = useState<ComboboxOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  useEffect(() => {
    fetchRentals();
    fetchAvailableTools();
    fetchClients();
  }, []);

  const fetchRentals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tool-rentals");
      if (response.ok) {
        const data = await response.json();
        setRentals(data);
      }
    } catch (error) {
      console.error("Error fetching rentals:", error);
      toast.error("Failed to load rentals");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTools = async () => {
    try {
      const response = await fetch("/api/tools");
      if (response.ok) {
        const data = await response.json();
        const filtered = data.filter(
          (tool: any) =>
            tool.status === "AVAILABLE" && tool.canBeRented === true
        );
        setAvailableTools(filtered);
      }
    } catch (error) {
      console.error("Error fetching tools:", error);
    }
  };

  const fetchClients = async () => {
    try {
      setIsLoadingClients(true);
      const response = await fetch("/api/clients");
      if (response.ok) {
        const data = await response.json();
        setClients(data);
        const options: ComboboxOption[] = data.map((client: Client) => ({
          label: client.company
            ? `${client.name} - ${client.company}`
            : client.name,
          value: client.id,
        }));
        setClientsOptions(options);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const acceptRental = async (rentalId: string) => {
    try {
      const response = await fetch(`/api/tool-rentals/${rentalId}/accept`, {
        method: "POST",
      });

      if (response.ok) {
        fetchRentals();
        toast.success("Rental accepted! Invoice has been created.");
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error accepting rental:", error);
      toast.error("Error accepting rental");
    }
  };

  const filteredRentals = rentals.filter((rental) => {
    const matchesSearch =
      rental.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (rental.renterContact?.toLowerCase().includes(searchTerm.toLowerCase()) ??
        false);

    const matchesStatus =
      selectedStatus === "All Status" || rental.status === selectedStatus;

    let matchesPaymentStatus = true;
    if (selectedPaymentStatus === "PAID")
      matchesPaymentStatus = rental.paymentStatus === "PAID";
    else if (selectedPaymentStatus === "PENDING")
      matchesPaymentStatus = rental.paymentStatus === "PENDING";
    else if (selectedPaymentStatus === "OVERDUE")
      matchesPaymentStatus = rental.paymentStatus === "OVERDUE";

    let matchesTab = true;
    if (activeTab === "active") matchesTab = rental.status === "ACTIVE";
    else if (activeTab === "pending") matchesTab = rental.status === "PENDING";
    else if (activeTab === "completed")
      matchesTab = rental.status === "COMPLETED";
    else if (activeTab === "pending-payment")
      matchesTab = rental.paymentStatus === "PENDING";

    return matchesSearch && matchesStatus && matchesPaymentStatus && matchesTab;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("All Status");
    setSelectedPaymentStatus("All");
    setActiveTab("all");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Tool Rental Tracking
          </h2>
          <p className="text-muted-foreground">
            Manage rental agreements, track payments, and monitor rental history
          </p>
        </div>
        <CreateRentalDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          clientsOptions={clientsOptions}
          isLoadingClients={isLoadingClients}
          availableTools={availableTools}
          onClientAdded={fetchClients}
          onRentalCreated={fetchRentals}
        />
      </div>

      {/* Statistics */}
      <RentalStats rentals={rentals} />

      <RentalFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedPaymentStatus={selectedPaymentStatus}
        onPaymentStatusChange={setSelectedPaymentStatus}
      />
      <RentalsTable
        rentals={filteredRentals}
        loading={loading}
        onAcceptRental={acceptRental}
      />

      {/* Empty State */}
      {filteredRentals.length === 0 && !loading && (
        <EmptyState onClearFilters={clearFilters} />
      )}
    </div>
  );
}
