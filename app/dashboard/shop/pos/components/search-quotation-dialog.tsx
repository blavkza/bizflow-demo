"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  FileText,
  Calendar,
  User,
  Check,
  Edit,
  Eye,
  Loader2,
  ShoppingCart,
  Percent,
  UserCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  Calculator,
} from "lucide-react";
import { useState, useEffect } from "react";
import { format } from "date-fns";

interface Quotation {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  subtotal?: number;
  total: number;
  status: string;
  expiryDate: string | null;
  createdAt: string;
  createdBy: string;
  items: Array<{
    quantity: number;
    price: any;
    total: any;
    shopProduct: {
      id: string;
      name: string;
      sku: string;
      price: any;
      images: string[];
      stock: number;
    };
  }>;
  isDelivery: boolean;
  deliveryAddress?: string;
  deliveryInstructions?: string;
  discount?: number;
  discountPercent: number;
  tax?: number;
  deliveryFee: number;
}

interface SearchQuotationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadQuotation: (quotation: Quotation) => void;
  onEditQuotation?: (quotation: Quotation) => void;
  onConvertToSale?: (quotation: Quotation) => void;
  isLoading?: boolean;
}

export function SearchQuotationDialog({
  isOpen,
  onOpenChange,
  onLoadQuotation,
  onEditQuotation,
  onConvertToSale,
  isLoading = false,
}: SearchQuotationDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(
    null
  );

  const searchQuotations = async () => {
    if (!searchTerm.trim()) {
      setQuotations([]);
      return;
    }

    setSearching(true);
    try {
      const response = await fetch(
        `/api/shop/quotations?search=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();
      setQuotations(data);
    } catch (error) {
      console.error("Error searching quotations:", error);
    } finally {
      setSearching(false);
    }
  };

  const handleLoad = () => {
    if (selectedQuotation) {
      onLoadQuotation(selectedQuotation);
      onOpenChange(false);
    }
  };

  const handleEdit = () => {
    if (selectedQuotation && onEditQuotation) {
      onEditQuotation(selectedQuotation);
      onOpenChange(false);
    }
  };

  const handleConvert = () => {
    if (selectedQuotation && onConvertToSale) {
      onConvertToSale(selectedQuotation);
      onOpenChange(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200"
          >
            Pending
          </Badge>
        );
      case "CONVERTED":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            Converted
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 border-red-200"
          >
            Expired
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge
            variant="outline"
            className="bg-gray-50 text-gray-700 border-gray-200"
          >
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Helper function to safely convert Decimal to number
  const safeToNumber = (value: any): number => {
    if (typeof value === "number") return value;
    if (typeof value === "string") return parseFloat(value) || 0;
    if (value && typeof value === "object" && "toNumber" in value) {
      return value.toNumber ? value.toNumber() : 0;
    }
    return 0;
  };

  // Calculate everything from total (for backwards compatibility)
  const calculateFromTotal = (quotation: Quotation) => {
    const total = safeToNumber(quotation.total);
    const deliveryFee = safeToNumber(quotation.deliveryFee);
    const discountPercent = quotation.discountPercent || 0;

    // Remove delivery fee from total first
    const totalWithoutDelivery = total - deliveryFee;

    // Calculate VAT amount (15% of taxable amount)
    // VAT inclusive price = Taxable amount × 1.15
    // So Taxable amount = VAT inclusive price ÷ 1.15
    // And VAT = VAT inclusive price × (15/115)
    const taxableAmount = totalWithoutDelivery / 1.15;
    const vatAmount = totalWithoutDelivery * (15 / 115);

    // If there's a discount, calculate original subtotal before discount
    let originalSubtotal = taxableAmount;
    let discountAmount = 0;

    if (discountPercent > 0) {
      // taxableAmount = originalSubtotal × (1 - discountPercent/100)
      // So originalSubtotal = taxableAmount ÷ (1 - discountPercent/100)
      originalSubtotal = taxableAmount / (1 - discountPercent / 100);
      discountAmount = originalSubtotal * (discountPercent / 100);
    }

    return {
      originalSubtotal: parseFloat(originalSubtotal.toFixed(2)),
      taxableAmount: parseFloat(taxableAmount.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      deliveryFee,
      total,
    };
  };

  // Calculate from items (if we need to verify)
  const calculateFromItems = (quotation: Quotation) => {
    const itemsTotal = quotation.items.reduce((sum, item) => {
      const itemPrice = safeToNumber(item.price);
      return sum + itemPrice * item.quantity;
    }, 0);

    const subtotal = parseFloat(itemsTotal.toFixed(2));
    const discountPercent = quotation.discountPercent || 0;
    const discountAmount = (subtotal * discountPercent) / 100;
    const netSubtotal = subtotal - discountAmount;
    const vatAmount = netSubtotal * 0.15;
    const deliveryFee = safeToNumber(quotation.deliveryFee);
    const calculatedTotal = netSubtotal + vatAmount + deliveryFee;

    return {
      subtotal,
      discountAmount: parseFloat(discountAmount.toFixed(2)),
      vatAmount: parseFloat(vatAmount.toFixed(2)),
      deliveryFee,
      calculatedTotal: parseFloat(calculatedTotal.toFixed(2)),
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Quotations
          </DialogTitle>
          <DialogDescription>
            Search quotations by number, customer name, phone, or email
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search-quotation">Search Quotations</Label>
            <div className="flex gap-2">
              <Input
                id="search-quotation"
                placeholder="Enter quotation number, customer name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchQuotations()}
              />
              <Button
                onClick={searchQuotations}
                disabled={searching}
                className="whitespace-nowrap"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {quotations.length > 0 ? (
            <div className="space-y-2">
              <Label>Search Results ({quotations.length})</Label>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quote #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Expiry</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quotations.map((quote) => (
                      <TableRow
                        key={quote.id}
                        className={
                          selectedQuotation?.id === quote.id
                            ? "bg-blue-50 dark:bg-zinc-800"
                            : ""
                        }
                        onClick={() => setSelectedQuotation(quote)}
                      >
                        <TableCell className="font-mono font-medium">
                          {quote.quoteNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {quote.customerName || "No name"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {quote.customerPhone || "No phone"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {quote.items.length} item(s)
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          R{safeToNumber(quote.total).toFixed(2)}
                        </TableCell>
                        <TableCell>{getStatusBadge(quote.status)}</TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            {quote.createdBy || "System"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(quote.createdAt), "dd/MM/yyyy")}
                        </TableCell>
                        <TableCell className="text-sm">
                          {quote.expiryDate
                            ? format(new Date(quote.expiryDate), "dd/MM/yyyy")
                            : "No expiry"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedQuotation(quote);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : searchTerm && !searching ? (
            <div className="text-center py-8 text-muted-foreground">
              No quotations found
            </div>
          ) : null}

          {/* Selected Quotation Details */}
          {selectedQuotation &&
            (() => {
              const calculations = calculateFromTotal(selectedQuotation);
              const itemsCalculation = calculateFromItems(selectedQuotation);
              const hasStoredTax =
                selectedQuotation.tax !== undefined &&
                selectedQuotation.tax !== null;
              const hasStoredSubtotal =
                selectedQuotation.subtotal !== undefined &&
                selectedQuotation.subtotal !== null;

              return (
                <div className="space-y-4 p-4 bg-blue-50 dark:bg-zinc-900 rounded-lg border border-blue-200">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        Quotation: {selectedQuotation.quoteNumber}
                      </h4>
                      <div className="text-sm text-blue-600 mt-1 flex items-center gap-2">
                        Created by: {selectedQuotation.createdBy || "System"}
                        <span className="text-gray-400">•</span>
                        {format(
                          new Date(selectedQuotation.createdAt),
                          "dd/MM/yyyy HH:mm"
                        )}
                      </div>
                    </div>
                    {selectedQuotation.expiryDate && (
                      <div className="flex items-center gap-1 text-sm">
                        Expires:{" "}
                        {format(
                          new Date(selectedQuotation.expiryDate),
                          "dd/MM/yyyy"
                        )}
                      </div>
                    )}
                  </div>

                  {/* Two Column Layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Details */}
                    <div>
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Customer Details
                      </div>
                      <div className="space-y-2 text-sm bg-white dark:bg-zinc-800 p-3 rounded border">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">Name:</span>
                          <span>
                            {selectedQuotation.customerName || "Not specified"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">Phone:</span>
                          <span>
                            {selectedQuotation.customerPhone || "Not specified"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-gray-500" />
                          <span className="font-medium">Email:</span>
                          <span>
                            {selectedQuotation.customerEmail || "Not specified"}
                          </span>
                        </div>

                        {selectedQuotation.isDelivery &&
                          selectedQuotation.deliveryAddress && (
                            <div className="mt-2 pt-2 border-t">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-3 w-3 text-gray-500" />
                                <span className="font-medium">
                                  Delivery Address:
                                </span>
                              </div>
                              <div className="text-xs pl-5">
                                {selectedQuotation.deliveryAddress}
                              </div>
                              {selectedQuotation.deliveryInstructions && (
                                <div className="text-xs pl-5 mt-1 italic">
                                  Instructions:{" "}
                                  {selectedQuotation.deliveryInstructions}
                                </div>
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div>
                      <div className="font-medium mb-2 flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Order Summary
                        {!hasStoredTax && (
                          <Badge
                            variant="outline"
                            className="h-5 text-xs bg-yellow-50 text-yellow-700"
                          >
                            VAT Calculated
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm bg-white dark:bg-zinc-800 p-3 rounded border">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="font-medium">Items:</div>
                          <div className="text-right">
                            {selectedQuotation.items.length}
                          </div>

                          <div className="font-medium">Original Subtotal:</div>
                          <div className="text-right">
                            R{calculations.originalSubtotal.toFixed(2)}
                          </div>

                          {selectedQuotation.discountPercent > 0 && (
                            <>
                              <div className="flex items-center gap-1 font-medium">
                                <Percent className="h-3 w-3" />
                                Discount ({selectedQuotation.discountPercent}%):
                              </div>
                              <div className="text-right text-red-600">
                                -R{calculations.discountAmount.toFixed(2)}
                              </div>
                            </>
                          )}

                          <div className="font-medium">Taxable Amount:</div>
                          <div className="text-right">
                            R{calculations.taxableAmount.toFixed(2)}
                          </div>

                          <div className="font-medium flex items-center gap-1">
                            <Badge variant="outline" className="h-5 text-xs">
                              15% VAT
                            </Badge>
                            Tax:
                          </div>
                          <div className="text-right">
                            R{calculations.vatAmount.toFixed(2)}
                            {!hasStoredTax && (
                              <span className="text-xs text-muted-foreground ml-1">
                                (calculated)
                              </span>
                            )}
                          </div>

                          <div className="font-medium">Delivery:</div>
                          <div className="text-right">
                            {selectedQuotation.isDelivery
                              ? `R${calculations.deliveryFee.toFixed(2)}`
                              : "No"}
                          </div>

                          <Separator className="col-span-2 my-1" />

                          <div className="font-bold">Total:</div>
                          <div className="text-right font-bold">
                            R{calculations.total.toFixed(2)}
                          </div>
                        </div>

                        {/* Verification */}
                        {/*   <div className="mt-3 pt-3 border-t">
                          <div className="font-medium mb-1 text-xs text-gray-600">
                            Verification:
                          </div>
                          <div className="text-xs grid grid-cols-2 gap-1">
                            <div>Subtotal from items:</div>
                            <div className="text-right">
                              R{itemsCalculation.subtotal.toFixed(2)}
                            </div>

                            <div>Calculated total from items:</div>
                            <div className="text-right">
                              R{itemsCalculation.calculatedTotal.toFixed(2)}
                            </div>

                            <div className="col-span-2 pt-1">
                              {Math.abs(
                                itemsCalculation.calculatedTotal -
                                  calculations.total
                              ) < 0.01 ? (
                                <div className="text-green-600 font-medium">
                                  ✓ Totals match
                                </div>
                              ) : (
                                <div className="text-amber-600">
                                  ⚠ Difference: R
                                  {Math.abs(
                                    itemsCalculation.calculatedTotal -
                                      calculations.total
                                  ).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div>
                    <div className="font-medium mb-2">
                      Items ({selectedQuotation.items.length})
                    </div>
                    <div className=" space-y-2">
                      {selectedQuotation.items.map((item, index) => {
                        const itemPrice = safeToNumber(item.price);
                        const itemTotal = safeToNumber(item.total);
                        const productPrice = safeToNumber(
                          item.shopProduct.price
                        );

                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center p-3 bg-white dark:bg-zinc-800 rounded border hover:bg-gray-50"
                          >
                            <div className="flex items-center gap-3">
                              {item.shopProduct.images?.[0] ? (
                                <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                                  <img
                                    src={item.shopProduct.images[0]}
                                    alt={item.shopProduct.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                  <ShoppingCart className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">
                                  {item.shopProduct.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  SKU: {item.shopProduct.sku}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Stock: {item.shopProduct.stock} | Unit Price:
                                  R{productPrice.toFixed(2)}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold">
                                {item.quantity} × R{itemPrice.toFixed(2)}
                              </div>
                              <div className="font-bold text-lg">
                                R{itemTotal.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Line total
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {selectedQuotation.status === "PENDING" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleLoad}
                        disabled={selectedQuotation.status !== "PENDING"}
                        variant="default"
                        className="flex-1"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        Load to Cart
                      </Button>

                      {onEditQuotation && (
                        <Button
                          onClick={handleEdit}
                          disabled={selectedQuotation.status !== "PENDING"}
                          variant="outline"
                          className="flex-1"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Quotation
                        </Button>
                      )}

                      {onConvertToSale && (
                        <Button
                          onClick={handleConvert}
                          disabled={selectedQuotation.status !== "PENDING"}
                          variant="outline"
                          className="flex-1"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Convert to Sale
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSearchTerm("");
              setQuotations([]);
              setSelectedQuotation(null);
            }}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
