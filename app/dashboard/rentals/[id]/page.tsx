"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Download,
  Send,
  Edit,
  Trash2,
  MoreHorizontal,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// Components
import RentalHeader from "./components/rental-header";
import StatusBadges from "./components/status-badges";
import PaymentProgress from "./components/payment-progress";
import ToolInformation from "./components/tool-information";
import RentalPeriod from "./components/rental-period";
import RenterInformation from "./components/renter-information";
import TimelineTab from "./components/timeline-tab";
import DamageReportsTab from "./components/damage-reports-tab";
import PaymentHistoryTab from "./components/payment-history-tab";
import NotesCard from "./components/notes-card";
import StatusManagement from "./components/status-management";
import PricingCard from "./components/pricing-card";
import QuickActions from "./components/quick-actions";

import { ToolRentalDetail } from "./types";
import {
  getAvailableStatusOptions,
  calculateTimeline,
  formatDecimal,
} from "./utils";
import RentalDetailLoadingSkeleton from "./components/loading-skeleton";

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rental, setRental] = useState<ToolRentalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  const rentalId = params.id as string;

  useEffect(() => {
    fetchRentalDetail();
  }, [rentalId]);

  const fetchRentalDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tool-rentals/${rentalId}`);
      if (response.ok) {
        const data = await response.json();
        setRental(data);
        setSelectedStatus(data.status);
      } else {
        toast.error("Failed to load rental details");
        router.push("/tool-rentals");
      }
    } catch (error) {
      console.error("Error fetching rental details:", error);
      toast.error("Failed to load rental details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus) {
      toast.error("Please select a status");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/tool-rentals/${rentalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: selectedStatus,
          ...(selectedStatus === "COMPLETED" && {
            returnDate: new Date().toISOString(),
          }),
        }),
      });

      if (response.ok) {
        toast.success("Status updated successfully");
        setIsStatusDialogOpen(false);
        fetchRentalDetail();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <RentalDetailLoadingSkeleton />;
  }

  if (!rental) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Rental Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The rental you're looking for doesn't exist.
          </p>
          <Button asChild>
            <Link href="/tool-rentals">Back to Rentals</Link>
          </Button>
        </div>
      </div>
    );
  }

  const timeline = calculateTimeline(rental);
  const paidAmount = formatDecimal(rental.amountPaid);
  const totalCost = formatDecimal(rental.totalCost);
  const paymentPercentage = totalCost > 0 ? (paidAmount / totalCost) * 100 : 0;
  const availableStatusOptions = getAvailableStatusOptions(rental);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <RentalHeader
        rental={rental}
        onStatusDialogOpen={() => setIsStatusDialogOpen(true)}
      />

      {/* Status Badges */}
      <StatusBadges rental={rental} />

      {/* Payment Progress */}
      {paymentPercentage > 0 && (
        <PaymentProgress
          paidAmount={paidAmount}
          totalCost={totalCost}
          paymentPercentage={paymentPercentage}
        />
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Tool & Rental Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tool Information */}
          <ToolInformation rental={rental} />

          {/* Renter Information */}
          <RenterInformation rental={rental} />
        </div>

        {/* Right: Pricing & Actions */}
        <div className="space-y-4">
          {/* Status Management */}
          <StatusManagement
            rental={rental}
            onStatusDialogOpen={() => setIsStatusDialogOpen(true)}
          />

          {/* Pricing Card */}
          <PricingCard rental={rental} />

          {/* Quick Actions */}
          <QuickActions rental={rental} onRentalUpdated={fetchRentalDetail} />
          {/* Rental Period */}
          <RentalPeriod rental={rental} />
        </div>
      </div>
      {/* Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="damages">Damage Reports</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        {/* Timeline Tab */}
        <TabsContent value="timeline">
          <TimelineTab timeline={timeline} />
        </TabsContent>

        {/* Damage Reports Tab */}
        <TabsContent value="damages">
          <DamageReportsTab
            rental={rental}
            onRentalUpdated={fetchRentalDetail}
          />
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="payments">
          <PaymentHistoryTab rental={rental} />
        </TabsContent>
      </Tabs>

      {/* Notes Card */}
      <NotesCard rental={rental} onRentalUpdated={fetchRentalDetail} />

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Rental Status</DialogTitle>
            <DialogDescription>
              Change the current status of this rental agreement.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedStatus === "COMPLETED" && paymentPercentage < 100 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  <AlertTriangle className="h-4 w-4 inline mr-1" />
                  This rental has outstanding payments. Are you sure you want to
                  mark it as completed?
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={updating || !selectedStatus}
            >
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
