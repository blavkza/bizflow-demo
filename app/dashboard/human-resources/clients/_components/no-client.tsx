"use client";
import React, { useState } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Building, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock data for clients
const clients = [
  {
    id: "1",
    name: "Acme Corporation",
    email: "contact@acme.com",
    phone: "+27 11 123 4567",
    status: "Active",
    type: "Enterprise",
    outstandingBalance: 45000,
    lastPayment: "2024-01-15",
    totalRevenue: 250000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "2",
    name: "Tech Solutions Ltd",
    email: "info@techsolutions.co.za",
    phone: "+27 21 987 6543",
    status: "Active",
    type: "Business",
    outstandingBalance: 12500,
    lastPayment: "2024-01-20",
    totalRevenue: 180000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "3",
    name: "Green Energy Co",
    email: "hello@greenenergy.co.za",
    phone: "+27 31 555 0123",
    status: "Overdue",
    type: "Business",
    outstandingBalance: 78000,
    lastPayment: "2023-12-10",
    totalRevenue: 320000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "4",
    name: "Digital Marketing Pro",
    email: "team@digitalmarketing.co.za",
    phone: "+27 11 444 5555",
    status: "Active",
    type: "SME",
    outstandingBalance: 5500,
    lastPayment: "2024-01-22",
    totalRevenue: 95000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    id: "5",
    name: "Construction Masters",
    email: "office@constructionmasters.co.za",
    phone: "+27 12 777 8888",
    status: "Inactive",
    type: "Enterprise",
    outstandingBalance: 0,
    lastPayment: "2023-11-30",
    totalRevenue: 450000,
    avatar: "/placeholder.svg?height=40&width=40",
  },
];

export default function NoClient() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {filteredClients.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No clients found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== "All"
                ? "Try adjusting your search or filter criteria."
                : "Get started by adding your first client."}
            </p>
            {!searchTerm && statusFilter === "All" && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Client
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
