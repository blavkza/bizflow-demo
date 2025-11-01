"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  User,
  ShoppingCart,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

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
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  processedBy: string | null;
  processedAt: string | null;
  createdAt: string;
  sale: {
    id: string;
    saleNumber: string;
    customerName: string | null;
    customerPhone: string | null;
    customerEmail: string | null;
    total: number;
    paymentMethod: string;
    saleDate: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    total: number;
    taxAmount: number;
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
    label: "Pending Approval",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  COMPLETED: {
    label: "Completed",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: XCircle,
  },
};

const methodConfig = {
  ORIGINAL_METHOD: "Original Payment Method",
  CASH: "Cash",
  CREDIT_CARD: "Credit Card",
  BANK_TRANSFER: "Bank Transfer",
  STORE_CREDIT: "Store Credit",
};

export default function RefundDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [refund, setRefund] = useState<Refund | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const refundId = params.id as string;

  useEffect(() => {
    if (refundId) {
      fetchRefund();
    }
  }, [refundId]);

  const fetchRefund = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/refunds/${refundId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch refund");
      }

      const data = await response.json();
      setRefund(data.data);
    } catch (error) {
      console.error("Error fetching refund:", error);
      toast({
        title: "Error",
        description: "Failed to load refund details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/refunds/${refundId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          approvedBy: "current-user-id", // Replace with actual user ID
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Refund Approved",
          description: "Refund has been approved and is ready for processing",
        });
        fetchRefund(); // Refresh data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error approving refund:", error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve refund",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/refunds/${refundId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rejectedBy: "current-user-id", // Replace with actual user ID
          rejectionReason,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Refund Rejected",
          description: "Refund request has been rejected",
        });
        setRejectionDialogOpen(false);
        setRejectionReason("");
        fetchRefund(); // Refresh data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error rejecting refund:", error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject refund",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/refunds/${refundId}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          processedBy: "current-user-id", // Replace with actual user ID
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Refund Completed",
          description: "Refund has been processed successfully",
        });
        fetchRefund(); // Refresh data
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error completing refund:", error);
      toast({
        title: "Completion Failed",
        description: "Failed to complete refund",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading refund details...</p>
        </div>
      </div>
    );
  }

  if (!refund) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground">
            Refund Not Found
          </h2>
          <p className="text-muted-foreground mt-2">
            The refund you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/shop/refunds">Back to Refunds</Link>
          </Button>
        </div>
      </div>
    );
  }

  const statusConfigItem =
    statusConfig[refund.status as keyof typeof statusConfig];
  const StatusIcon = statusConfigItem.icon;
  const totalItems = refund.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/shop/refunds">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Refund Details
            </h2>
            <p className="text-muted-foreground">{refund.refundNumber}</p>
          </div>
        </div>

        <Badge className={statusConfigItem.color} variant="outline">
          <StatusIcon className="h-4 w-4 mr-2" />
          {statusConfigItem.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Refund Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Refund Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refund.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {item.saleItem.ShopProduct.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            SKU: {item.saleItem.ShopProduct.sku}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>R{Number(item.price).toFixed(2)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        R{Number(item.taxAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        R{Number(item.total).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Refund Reason */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Refund Reason
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{refund.reason}</p>
            </CardContent>
          </Card>

          {/* Rejection Reason (if rejected) */}
          {refund.status === "REJECTED" && refund.rejectionReason && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{refund.rejectionReason}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Refund Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Refund Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Refund Method:</span>
                  <div>
                    {methodConfig[refund.method as keyof typeof methodConfig]}
                  </div>
                </div>
                <div>
                  <span className="font-semibold">Items:</span>
                  <div>{totalItems}</div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    R
                    {(Number(refund.amount) - Number(refund.taxAmount)).toFixed(
                      2
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (15%):</span>
                  <span>R{Number(refund.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total Refund:</span>
                  <span>R{Number(refund.amount).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sale Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Sale Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-semibold">Sale Number:</span>
                <div>
                  <Link
                    href={`/dashboard/shop/sales/${refund.sale.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {refund.sale.saleNumber}
                  </Link>
                </div>
              </div>
              <div>
                <span className="font-semibold">Original Sale Total:</span>
                <div>R{Number(refund.sale.total).toFixed(2)}</div>
              </div>
              <div>
                <span className="font-semibold">Payment Method:</span>
                <div>{refund.sale.paymentMethod}</div>
              </div>
              <div>
                <span className="font-semibold">Sale Date:</span>
                <div>{new Date(refund.sale.saleDate).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-semibold">Customer:</span>
                <div>{refund.sale.customerName || "Walk-in Customer"}</div>
              </div>
              {refund.sale.customerPhone && (
                <div>
                  <span className="font-semibold">Phone:</span>
                  <div>{refund.sale.customerPhone}</div>
                </div>
              )}
              {refund.sale.customerEmail && (
                <div>
                  <span className="font-semibold">Email:</span>
                  <div>{refund.sale.customerEmail}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-semibold">Requested:</span>
                <div className="text-sm">
                  {new Date(refund.createdAt).toLocaleString()} by{" "}
                  {refund.requestedBy}
                </div>
              </div>
              {refund.approvedAt && (
                <div>
                  <span className="font-semibold">Approved:</span>
                  <div className="text-sm">
                    {new Date(refund.approvedAt).toLocaleString()} by{" "}
                    {refund.approvedBy}
                  </div>
                </div>
              )}
              {refund.rejectedAt && (
                <div>
                  <span className="font-semibold">Rejected:</span>
                  <div className="text-sm">
                    {new Date(refund.rejectedAt).toLocaleString()} by{" "}
                    {refund.rejectedBy}
                  </div>
                </div>
              )}
              {refund.processedAt && (
                <div>
                  <span className="font-semibold">Processed:</span>
                  <div className="text-sm">
                    {new Date(refund.processedAt).toLocaleString()} by{" "}
                    {refund.processedBy}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {refund.status === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve Refund
                </Button>
                <Button
                  onClick={() => setRejectionDialogOpen(true)}
                  disabled={actionLoading}
                  variant="outline"
                  className="w-full text-red-600 border-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Refund
                </Button>
              </CardContent>
            </Card>
          )}

          {refund.status === "APPROVED" && (
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Process Refund
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="rejection-reason">Rejection Reason</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter reason for rejection..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
              variant="destructive"
            >
              {actionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
