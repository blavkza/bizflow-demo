"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Calendar,
  Clock,
  MapPin,
  FileText,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { Sale } from "@prisma/client";

type QuoteStatus = "PENDING" | "CONVERTED" | "EXPIRED" | "CANCELLED";

interface Quotation {
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  customerAddress: string | null;
  status: QuoteStatus;
  expiryDate: string | null;
  createdAt: string;
  createdBy: string | null;
  isDelivery: boolean;
  deliveryAddress: string | null;
  deliveryInstructions: string | null;
  notes: string | null;
  items: any[];
  convertedTo?: Sale | null;
}

interface QuotationInfoCardsProps {
  quotation: Quotation;
}

export default function QuotationInfoCards({
  quotation,
}: QuotationInfoCardsProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = () => {
    if (!quotation.expiryDate) return false;
    const expiryDate = new Date(quotation.expiryDate);
    const today = new Date();
    return (
      expiryDate < today &&
      quotation.status !== "CONVERTED" &&
      quotation.status !== "CANCELLED"
    );
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Customer Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Customer Info</CardTitle>
          <User className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="font-medium">
              {quotation.customerName || "No Customer"}
            </p>
            {quotation.customerPhone && (
              <p className="text-sm text-muted-foreground">
                {quotation.customerPhone}
              </p>
            )}
            {quotation.customerEmail && (
              <p className="text-sm text-muted-foreground">
                {quotation.customerEmail}
              </p>
            )}
            {quotation.customerAddress && (
              <p className="text-sm text-muted-foreground">
                {quotation.customerAddress}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quotation Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Quotation Details
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Created:</span>
            <span className="text-sm font-medium">
              {formatDate(quotation.createdAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Valid Until:</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-sm font-medium ${isExpired() ? "text-red-600" : ""}`}
              >
                {formatDate(quotation.expiryDate)}
              </span>
              {isExpired() && (
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Created By:</span>
            <span className="text-sm font-medium">
              {quotation.createdBy || "System"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Items:</span>
            <span className="text-sm font-medium">
              {quotation.items.length}
            </span>
          </div>
          {quotation.status === "CONVERTED" && quotation.convertedTo && (
            <div className="mt-2">
              <Link
                href={`/dashboard/shop/sales/${quotation.convertedTo.id}`}
                className="text-blue-600 hover:underline flex items-center gap-1"
              >
                <ShoppingBag className="h-4 w-4" />
                {quotation.convertedTo.saleNumber}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery & Notes Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Additional Info</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-3">
          {quotation.isDelivery ? (
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Delivery Required</p>
                  {quotation.deliveryAddress && (
                    <p className="text-sm text-muted-foreground">
                      {quotation.deliveryAddress}
                    </p>
                  )}
                  {quotation.deliveryInstructions && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {quotation.deliveryInstructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-medium">Customer Pickup</p>
            </div>
          )}

          {quotation.notes && (
            <div className="pt-2 border-t">
              <p className="text-sm font-medium mb-1">Notes:</p>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {quotation.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
