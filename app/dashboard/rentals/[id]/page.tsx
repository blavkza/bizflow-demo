"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Download,
  Send,
  Edit,
  Plus,
  Trash2,
  FileText,
  ImageIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import Image from "next/image";

// Types
interface ToolRentalDetail {
  id: string;
  toolId: string;
  tool: {
    name: string;
    description: string | null;
    primaryImage: string | null;
    images: any;
    condition: string;
  };
  businessName: string;
  renterContact: string | null;
  renterEmail: string | null;
  renterPhone: string | null;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalRate: number;
  rentalDays: number | null;
  totalCost: number | null;
  status: string;
  paymentStatus: string;
  amountPaid: number;
  remainingAmount: number | null;
  notes: string | null;
  damageReported: boolean;
  damageDescription: string | null;
  returnCondition: string | null;
  createdAt: string;
  quotation?: {
    id: string;
    status: string;
    createdAt: string;
    client: {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string | null;
      address: string | null;
    };
  };
  invoice?: {
    id: string;
    status: string;
    invoiceNumber: string;
    createdAt: string;
  };
  paymentHistory?: Array<{
    id: string;
    date: string;
    amount: number;
    method: string;
    reference: string;
    notes: string | null;
  }>;
}

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-blue-100 text-blue-800";
    case "PENDING":
      return "bg-purple-100 text-purple-800";
    case "COMPLETED":
      return "bg-green-100 text-green-800";
    case "CANCELLED":
      return "bg-red-100 text-red-800";
    case "OVERDUE":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800";
    case "PARTIAL":
      return "bg-yellow-100 text-yellow-800";
    case "PENDING":
      return "bg-orange-100 text-orange-800";
    case "OVERDUE":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getConditionColor(condition: string) {
  switch (condition) {
    case "EXCELLENT":
      return "bg-green-50 text-green-700 border-green-200";
    case "GOOD":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "FAIR":
      return "bg-yellow-50 text-yellow-700 border-yellow-200";
    case "POOR":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

function formatDecimal(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  if (typeof value === "object" && "toNumber" in value) {
    return value.toNumber();
  }
  return parseFloat(value.toString());
}

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [rental, setRental] = useState<ToolRentalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isDamageDialogOpen, setIsDamageDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
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
      } else {
        toast.error("Failed to load rental details");
      }
    } catch (error) {
      console.error("Error fetching rental details:", error);
      toast.error("Failed to load rental details");
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentAmount || !paymentMethod) {
      toast.error("Please fill in all payment details");
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`/api/tool-rentals/${rentalId}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          method: paymentMethod,
          reference: `PAY-${Date.now()}`,
        }),
      });

      if (response.ok) {
        toast.success("Payment recorded successfully");
        setIsPaymentDialogOpen(false);
        setPaymentAmount("");
        setPaymentMethod("");
        fetchRentalDetail();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Error recording payment");
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateNotes = async (notes: string) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/tool-rentals/${rentalId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      if (response.ok) {
        toast.success("Notes updated successfully");
        setIsNoteDialogOpen(false);
        fetchRentalDetail();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating notes:", error);
      toast.error("Error updating notes");
    } finally {
      setUpdating(false);
    }
  };

  const handleReportDamage = async (damageData: any) => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/tool-rentals/${rentalId}/damage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(damageData),
      });

      if (response.ok) {
        toast.success("Damage reported successfully");
        setIsDamageDialogOpen(false);
        fetchRentalDetail();
      } else {
        const error = await response.json();
        toast.error(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error reporting damage:", error);
      toast.error("Error reporting damage");
    } finally {
      setUpdating(false);
    }
  };

  const getToolImage = (tool: any) => {
    if (tool.primaryImage) return tool.primaryImage;
    if (tool.images && typeof tool.images === "string") return tool.images;
    if (tool.images && Array.isArray(tool.images) && tool.images.length > 0) {
      return tool.images[0];
    }
    return null;
  };

  const calculateTimeline = (rental: ToolRentalDetail) => {
    const timeline = [
      {
        id: 1,
        date: rental.createdAt,
        event: "Rental Agreement Created",
        description: "Rental agreement signed and confirmed",
        status: "completed" as const,
      },
      {
        id: 2,
        date: rental.rentalStartDate,
        event: "Rental Period Starts",
        description: "Tool rental period begins",
        status: rental.status === "PENDING" ? "pending" : "completed",
      },
      {
        id: 3,
        date: rental.rentalEndDate,
        event: "Rental Period Ends",
        description: "Scheduled return date",
        status:
          new Date(rental.rentalEndDate) > new Date() ? "pending" : "completed",
      },
    ];

    if (rental.quotation) {
      timeline.splice(1, 0, {
        id: 4,
        date: rental.quotation.createdAt || rental.createdAt,
        event: "Quotation Created",
        description: "Rental quotation generated",
        status: "completed",
      });
    }

    if (rental.invoice) {
      timeline.push({
        id: 5,
        date: rental.invoice.createdAt || rental.rentalStartDate,
        event: "Invoice Generated",
        description: "Payment invoice created",
        status: "completed",
      });
    }

    return timeline.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
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

  const toolImage = getToolImage(rental.tool);
  const timeline = calculateTimeline(rental);
  const paidAmount = formatDecimal(rental.amountPaid);
  const totalCost = formatDecimal(rental.totalCost);
  const pendingAmount = totalCost - paidAmount;

  const renderFormattedText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\n/g, "<br>");
  };

  const hasHTMLTags = (text: string): boolean => {
    return /<[a-z][\s\S]*>/i.test(text);
  };

  const getDescriptionHTML = (description: string): string => {
    if (!description) return "";

    if (hasHTMLTags(description)) {
      return renderFormattedText(description);
    }

    return description.replace(/\n/g, "<br>");
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rentals
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {rental.tool.name}
            </h2>
            <p className="text-muted-foreground">
              Rented by {rental.businessName} • Rental ID: #
              {rental.id.slice(-8)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit Rental
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel Rental
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        <Badge className={getStatusColor(rental.status)}>
          {rental.status.charAt(0).toUpperCase() +
            rental.status.slice(1).toLowerCase()}
        </Badge>
        <Badge className={getPaymentStatusColor(rental.paymentStatus)}>
          {rental.paymentStatus === "PARTIAL"
            ? "Partially Paid"
            : rental.paymentStatus.charAt(0).toUpperCase() +
              rental.paymentStatus.slice(1).toLowerCase()}
        </Badge>
        <Badge
          variant="outline"
          className={getConditionColor(rental.tool.condition)}
        >
          {rental.tool.condition.charAt(0).toUpperCase() +
            rental.tool.condition.slice(1).toLowerCase()}{" "}
          Condition
        </Badge>
        {rental.damageReported && (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Damage Reported
          </Badge>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Tool & Rental Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tool Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tool Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  {toolImage ? (
                    <Image
                      src={toolImage}
                      alt={rental.tool.name || "Tool image"}
                      width={800}
                      height={450}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Tool Name</p>
                    <p className="font-medium">{rental.tool.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Daily Rate</p>
                    <p className="font-medium">
                      R{formatDecimal(rental.rentalRate).toFixed(2)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    asChild
                  >
                    <Link href={`/tools/${rental.toolId}`}>
                      View Tool Details
                    </Link>
                  </Button>
                </div>
              </div>
              {rental.tool.description && (
                <div
                  className="prose prose-sm max-w-none text-muted-foreground "
                  dangerouslySetInnerHTML={{
                    __html: getDescriptionHTML(rental.tool.description || ""),
                  }}
                />
              )}
            </CardContent>
          </Card>

          {/* Rental Period Card */}
          <Card>
            <CardHeader>
              <CardTitle>Rental Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium">
                    {new Date(rental.rentalStartDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">End Date</p>
                  <p className="font-medium">
                    {new Date(rental.rentalEndDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">{rental.rentalDays || 0} days</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Daily Rate</p>
                  <p className="font-medium">
                    R{formatDecimal(rental.rentalRate).toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Renter Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Renter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Business</p>
                  <p className="font-medium">{rental.businessName}</p>
                </div>
                {rental.quotation?.client && (
                  <div>
                    <p className="text-sm text-muted-foreground">Client</p>
                    <p className="font-medium">
                      {rental.quotation.client.name}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-2 pt-2 border-t">
                {rental.renterPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${rental.renterPhone}`}
                      className="text-sm hover:underline"
                    >
                      {rental.renterPhone}
                    </a>
                  </div>
                )}
                {rental.renterEmail && (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${rental.renterEmail}`}
                      className="text-sm hover:underline"
                    >
                      {rental.renterEmail}
                    </a>
                  </div>
                )}
                {rental.quotation?.client?.address && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <p className="text-sm">{rental.quotation.client.address}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="damages" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="damages">Damage Reports</TabsTrigger>
              <TabsTrigger value="payments">Payment History</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
            </TabsList>

            {/* Damage Reports Tab */}
            <TabsContent value="damages">
              <DamageReportsTab
                rental={rental}
                isDamageDialogOpen={isDamageDialogOpen}
                setIsDamageDialogOpen={setIsDamageDialogOpen}
                onReportDamage={handleReportDamage}
                updating={updating}
              />
            </TabsContent>

            {/* Payment History Tab */}
            <TabsContent value="payments">
              <PaymentHistoryTab rental={rental} />
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline">
              <TimelineTab timeline={timeline} />
            </TabsContent>
          </Tabs>

          {/* Notes Card */}
          <NotesCard
            rental={rental}
            isNoteDialogOpen={isNoteDialogOpen}
            setIsNoteDialogOpen={setIsNoteDialogOpen}
            onUpdateNotes={handleUpdateNotes}
            updating={updating}
          />
        </div>

        {/* Right: Pricing & Actions */}
        <div className="space-y-4">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle>Rental Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">
                  {rental.rentalDays || 0} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daily Rate</span>
                <span className="font-medium">
                  R{formatDecimal(rental.rentalRate).toFixed(2)}
                </span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total Cost</span>
                <span>R{totalCost.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-medium">R{totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">R{paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-orange-600">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">R{pendingAmount.toFixed(2)}</span>
              </div>
              {/* Progress Bar */}
              <div className="pt-3 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{
                      width: `${totalCost > 0 ? (paidAmount / totalCost) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalCost > 0
                    ? Math.round((paidAmount / totalCost) * 100)
                    : 0}
                  % Paid
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <QuickActions
            isPaymentDialogOpen={isPaymentDialogOpen}
            setIsPaymentDialogOpen={setIsPaymentDialogOpen}
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            onRecordPayment={handleRecordPayment}
            updating={updating}
            rental={rental}
          />
        </div>
      </div>
    </div>
  );
}

// Component for Damage Reports Tab
function DamageReportsTab({
  rental,
  isDamageDialogOpen,
  setIsDamageDialogOpen,
  onReportDamage,
  updating,
}: any) {
  const [damageType, setDamageType] = useState("");
  const [severity, setSeverity] = useState("LOW");
  const [description, setDescription] = useState("");
  const [repairCost, setRepairCost] = useState("");

  const handleSubmit = () => {
    onReportDamage({
      damageType,
      severity,
      description,
      repairCost: repairCost ? parseFloat(repairCost) : 0,
    });
    setDamageType("");
    setSeverity("LOW");
    setDescription("");
    setRepairCost("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Damage Reports</CardTitle>
          <CardDescription>
            Track any damage or wear during rental period
          </CardDescription>
        </div>
        <Dialog open={isDamageDialogOpen} onOpenChange={setIsDamageDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Report Damage
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Report Tool Damage</DialogTitle>
              <DialogDescription>
                Document any damage or wear to the rental tool.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="damage-type">Damage Type</Label>
                <Input
                  id="damage-type"
                  placeholder="e.g., Scratch, Dent, Broken Part"
                  value={damageType}
                  onChange={(e) => setDamageType(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <select
                  className="w-full border rounded-md p-2"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="damage-desc">Description</Label>
                <Textarea
                  id="damage-desc"
                  placeholder="Describe the damage in detail"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="repair-cost">Repair Cost (Optional)</Label>
                <Input
                  id="repair-cost"
                  type="number"
                  placeholder="0.00"
                  value={repairCost}
                  onChange={(e) => setRepairCost(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDamageDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={updating}>
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Report Damage
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {rental.damageReported ? (
          <div className="space-y-3">
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">Reported Damage</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
                <Badge
                  className={
                    rental.damageDescription?.toLowerCase().includes("minor")
                      ? "bg-yellow-100 text-yellow-800"
                      : rental.damageDescription
                            ?.toLowerCase()
                            .includes("major")
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                  }
                >
                  {rental.damageDescription?.toLowerCase().includes("minor")
                    ? "Low"
                    : rental.damageDescription?.toLowerCase().includes("major")
                      ? "High"
                      : "Medium"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {rental.damageDescription}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
            <p className="text-muted-foreground">No damage reports recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for Payment History Tab
function PaymentHistoryTab({ rental }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment History</CardTitle>
        <CardDescription>All payments made for this rental</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rental.paymentHistory && rental.paymentHistory.length > 0 ? (
          rental.paymentHistory.map((payment: any) => (
            <div key={payment.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{payment.method}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.date).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  +R{formatDecimal(payment.amount).toFixed(2)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Reference: {payment.reference}
              </p>
              {payment.notes && (
                <p className="text-sm text-muted-foreground">{payment.notes}</p>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-muted-foreground">No payment history recorded</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for Timeline Tab
function TimelineTab({ timeline }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rental Timeline</CardTitle>
        <CardDescription>
          Key events and milestones for this rental
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timeline.map((event: any, index: number) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    event.status === "completed"
                      ? "bg-green-100"
                      : "bg-gray-100"
                  }`}
                >
                  {event.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-gray-600" />
                  )}
                </div>
                {index < timeline.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <p className="font-medium">{event.event}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.date).toLocaleDateString()} at{" "}
                  {new Date(event.date).toLocaleTimeString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {event.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Component for Notes Card
function NotesCard({
  rental,
  isNoteDialogOpen,
  setIsNoteDialogOpen,
  onUpdateNotes,
  updating,
}: any) {
  const [notes, setNotes] = useState(rental.notes || "");

  const handleSave = () => {
    onUpdateNotes(notes);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Notes</CardTitle>
        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Notes
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Rental Notes</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this rental"
                rows={5}
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNoteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={updating}>
                {updating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Save Notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {rental.notes || "No notes added for this rental."}
        </p>
      </CardContent>
    </Card>
  );
}

// Component for Quick Actions
function QuickActions({
  isPaymentDialogOpen,
  setIsPaymentDialogOpen,
  paymentAmount,
  setPaymentAmount,
  paymentMethod,
  setPaymentMethod,
  onRecordPayment,
  updating,
  rental,
}: any) {
  return (
    <div className="space-y-2">
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" size="lg">
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Add a payment record for this rental
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount</Label>
              <Input
                id="payment-amount"
                type="number"
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <select
                className="w-full border rounded-md p-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Select method</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CHECK">Check</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={onRecordPayment} disabled={updating}>
              {updating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Button variant="outline" className="w-full bg-transparent">
        <FileText className="h-4 w-4 mr-2" />
        Generate Invoice
      </Button>
      <Button variant="outline" className="w-full bg-transparent">
        <Send className="h-4 w-4 mr-2" />
        Send to Renter
      </Button>
    </div>
  );
}
