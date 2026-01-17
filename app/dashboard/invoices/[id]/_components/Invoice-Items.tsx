"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { InvoiceProps } from "@/types/invoice";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Box, Briefcase, Layers, Grid } from "lucide-react";
import { useState, useMemo } from "react";

interface InvoiceItemsProps {
  invoice: InvoiceProps;
}

// Extended type for calculated items
type CalculatedItem = InvoiceProps["items"][0] & {
  grossAmount: number;
  itemDiscountVal: number;
  discountInput: number;
  netAmount: number;
  taxAmount: number;
  lineTotal: number;
  itemType: "product" | "service" | "unknown";
};

// Type for combined services row
type CombinedServiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  itemDiscountType: "PERCENTAGE" | "AMOUNT" | "COMBINED" | null;
  itemDiscountAmount: number;
  itemDiscountVal: number;
  discountInput: number;
  taxAmount: number;
  amount: number;
  itemType: "service";
  grossAmount: number;
  netAmount: number;
  lineTotal: number;
  displayType: "combined-service";
  weightedTaxRate: number;
  individualServices?: CalculatedItem[];
};

export default function InvoiceItems({ invoice }: InvoiceProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  // --- 1. Calculate Item Level Logic ---
  let subtotalGross = 0;
  let totalItemDiscountMoney = 0;
  let totalTax = 0;

  const itemsWithCalculations: CalculatedItem[] = invoice.items.map((item) => {
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unitPrice);
    const grossAmount = quantity * unitPrice;
    const taxRate = Number(item.taxRate || 15); // Default 15% if not specified

    // Determine item discount
    let itemDiscountVal = 0;
    const discountInput = Number(item.itemDiscountAmount || 0);

    if (item.itemDiscountType === "PERCENTAGE") {
      itemDiscountVal = grossAmount * (discountInput / 100);
    } else if (item.itemDiscountType === "AMOUNT") {
      itemDiscountVal = discountInput;
    }

    // Cap discount
    itemDiscountVal = Math.min(itemDiscountVal, grossAmount);
    const netAmount = grossAmount - itemDiscountVal;

    // Calculate tax for this item
    const taxAmount = netAmount * (taxRate / 100);
    const lineTotal = netAmount + taxAmount;

    // Determine item type based on available IDs
    const itemType: "product" | "service" | "unknown" = item.shopProductId
      ? "product"
      : item.serviceId
        ? "service"
        : "unknown";

    // Accumulate totals
    subtotalGross += grossAmount;
    totalItemDiscountMoney += itemDiscountVal;
    totalTax += taxAmount;

    return {
      ...item,
      grossAmount,
      itemDiscountVal,
      discountInput,
      netAmount,
      lineTotal,
      itemType,
      // Ensure these are strings as per original type
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: String(lineTotal),
      taxRate: item.taxRate || "15",
      taxAmount: String(taxAmount),
    } as CalculatedItem;
  });

  // --- 2. Separate Products and Services ---
  const productItems = useMemo(() => {
    return itemsWithCalculations.filter((item) => item.itemType === "product");
  }, [itemsWithCalculations]);

  const serviceItems = useMemo(() => {
    return itemsWithCalculations.filter((item) => item.itemType === "service");
  }, [itemsWithCalculations]);

  // --- 3. Combined Services Calculation ---
  const combinedServices = useMemo(() => {
    if (serviceItems.length === 0) return null;

    let totalQuantity = 0;
    let totalGrossAmount = 0;
    let totalItemDiscountVal = 0;
    let totalNetAmount = 0;
    let totalTaxAmount = 0;
    let totalLineTotal = 0;
    const serviceDescriptions: string[] = [];

    serviceItems.forEach((service) => {
      totalQuantity += Number(service.quantity);
      totalGrossAmount += service.grossAmount;
      totalItemDiscountVal += service.itemDiscountVal;
      totalNetAmount += service.netAmount;
      totalTaxAmount += service.taxAmount;
      totalLineTotal += service.lineTotal;

      if (service.description) {
        serviceDescriptions.push(service.description);
      }
    });

    // Calculate weighted average tax rate for combined services
    let weightedTaxRate = 15; // Default to 15%

    if (serviceItems.length > 0) {
      // If all services have the same tax rate, use that
      const firstTaxRate = Number(serviceItems[0].taxRate || 15);
      const allSameTaxRate = serviceItems.every(
        (service) => Number(service.taxRate || 15) === firstTaxRate
      );

      if (allSameTaxRate) {
        weightedTaxRate = firstTaxRate;
      } else {
        // Calculate weighted average based on net amounts
        let totalWeightedTax = 0;
        serviceItems.forEach((service) => {
          const serviceTaxRate = Number(service.taxRate || 15);
          const serviceNetAmount = service.netAmount;
          totalWeightedTax += (serviceTaxRate / 100) * serviceNetAmount;
        });

        weightedTaxRate =
          totalNetAmount > 0 ? (totalWeightedTax / totalNetAmount) * 100 : 15;
      }
    }

    return {
      name: "Services Package",
      description:
        serviceDescriptions.length > 0
          ? `Includes: ${serviceDescriptions.slice(0, 3).join(", ")}${serviceDescriptions.length > 3 ? ` and ${serviceDescriptions.length - 3} more` : ""}`
          : "Services included in invoice",
      quantity: totalQuantity,
      unitPrice: totalQuantity > 0 ? totalGrossAmount / totalQuantity : 0,
      grossAmount: totalGrossAmount,
      itemDiscountVal: totalItemDiscountVal,
      netAmount: totalNetAmount,
      taxAmount: totalTaxAmount,
      lineTotal: totalLineTotal,
      weightedTaxRate: weightedTaxRate,
      services: serviceItems,
    };
  }, [serviceItems]);

  // --- 4. All Items with Combined Services ---
  const allItemsWithCombinedServices = useMemo(() => {
    const items: Array<CalculatedItem | CombinedServiceItem> = [];

    // Add all products
    items.push(...productItems);

    // Add combined services (single row) instead of individual services
    if (combinedServices) {
      items.push({
        id: "combined-services",
        description: combinedServices.name,
        quantity: combinedServices.quantity,
        unitPrice: combinedServices.unitPrice,
        taxRate: combinedServices.weightedTaxRate,
        itemDiscountType:
          combinedServices.itemDiscountVal > 0 ? ("COMBINED" as const) : null,
        itemDiscountAmount: combinedServices.itemDiscountVal,
        itemDiscountVal: combinedServices.itemDiscountVal,
        discountInput: combinedServices.itemDiscountVal,
        taxAmount: combinedServices.taxAmount,
        amount: combinedServices.lineTotal,
        itemType: "service",
        grossAmount: combinedServices.grossAmount,
        netAmount: combinedServices.netAmount,
        lineTotal: combinedServices.lineTotal,
        displayType: "combined-service",
        weightedTaxRate: combinedServices.weightedTaxRate,
        individualServices: combinedServices.services,
      } as CombinedServiceItem);
    }

    return items;
  }, [productItems, combinedServices]);

  // --- 5. Global Discount Logic ---
  const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;
  const globalDiscountInput = Number(invoice.discountAmount || 0);
  let globalDiscountMoney = 0;

  if (invoice.discountType === "PERCENTAGE") {
    globalDiscountMoney =
      subtotalAfterItemDiscounts * (globalDiscountInput / 100);
  } else if (invoice.discountType === "AMOUNT") {
    globalDiscountMoney = globalDiscountInput;
  }
  globalDiscountMoney = Math.min(
    globalDiscountMoney,
    subtotalAfterItemDiscounts
  );

  // --- 6. Totals ---
  const taxableAmount = subtotalAfterItemDiscounts - globalDiscountMoney;
  const totalAmount = taxableAmount + totalTax;

  // Use stored total if available, otherwise use calculated
  const finalTotal = invoice.totalAmount
    ? Number(invoice.totalAmount)
    : totalAmount;
  const finalTax = invoice.taxAmount ? Number(invoice.taxAmount) : totalTax;

  // Calculate effective tax rate for display
  const effectiveTaxRate =
    taxableAmount > 0 ? (finalTax / taxableAmount) * 100 : 0;

  // Deposit
  let depositMoney = 0;
  if (invoice.depositRequired) {
    if (invoice.depositAmount) {
      depositMoney = Number(invoice.depositAmount);
    } else if (invoice.depositType === "PERCENTAGE" && invoice.depositRate) {
      depositMoney = finalTotal * (Number(invoice.depositRate) / 100);
    }
  }

  const amountDue = finalTotal - depositMoney;

  // --- 7. Render Functions ---
  const renderItemsTable = (
    items: Array<CalculatedItem | CombinedServiceItem>
  ) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40%]">Description</TableHead>
          <TableHead className="text-center">Qty</TableHead>
          <TableHead className="text-right">Rate</TableHead>
          <TableHead className="text-right">Discount</TableHead>
          <TableHead className="text-center">Tax Rate</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">
              <div>{item.description}</div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                {"displayType" in item &&
                item.displayType === "combined-service" ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Layers className="h-3 w-3" />
                      Combined Services (
                      {(item as CombinedServiceItem).individualServices
                        ?.length || 0}{" "}
                      services)
                    </div>
                    {(item as CombinedServiceItem).individualServices
                      ?.length ? (
                      <ul className="ml-4 list-disc text-[11px]">
                        {(item as CombinedServiceItem).individualServices?.map(
                          (service, index) => (
                            <li key={service.id ?? index}>
                              {service.description}
                            </li>
                          )
                        )}
                      </ul>
                    ) : null}
                  </>
                ) : item.itemType === "product" ? (
                  <div className="flex items-center gap-1">
                    <Box className="h-3 w-3" />
                    Product
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Briefcase className="h-3 w-3" />
                    Service
                  </div>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center">
              {"quantity" in item && typeof item.quantity === "number"
                ? item.quantity.toLocaleString("en-ZA")
                : Number(item.quantity || 0).toLocaleString("en-ZA")}
            </TableCell>
            <TableCell className="text-right">
              {"displayType" in item &&
              item.displayType === "combined-service" ? (
                <span className="text-muted-foreground italic">-</span>
              ) : (
                formatCurrency(Number(item.unitPrice))
              )}
            </TableCell>
            <TableCell className="text-right text-red-600">
              {"itemDiscountVal" in item && item.itemDiscountVal > 0 ? (
                <>
                  -{formatCurrency(item.itemDiscountVal)}
                  {item.itemDiscountType === "PERCENTAGE" && (
                    <span className="text-xs ml-1 text-muted-foreground">
                      ({item.discountInput}%)
                    </span>
                  )}
                  {item.itemDiscountType === "COMBINED" && (
                    <span className="text-xs ml-1 text-muted-foreground">
                      (Combined)
                    </span>
                  )}
                </>
              ) : (
                "-"
              )}
            </TableCell>
            <TableCell className="text-center">
              {"displayType" in item && item.displayType === "combined-service"
                ? `${Number((item as CombinedServiceItem).taxRate).toFixed(0)}%`
                : `${Number(item.taxRate) || 0}%`}
            </TableCell>
            <TableCell className="text-right font-medium">
              {"displayType" in item
                ? formatCurrency((item as CombinedServiceItem).lineTotal)
                : formatCurrency((item as CalculatedItem).lineTotal)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderEmptyState = (type: string) => (
    <div className="p-8 text-center">
      {type === "products" && (
        <Box className="h-12 w-12 mx-auto text-gray-300 mb-4" />
      )}
      {type === "services" && (
        <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-4" />
      )}
      {type === "combined" && (
        <Layers className="h-12 w-12 mx-auto text-gray-300 mb-4" />
      )}
      {type === "all" && (
        <Grid className="h-12 w-12 mx-auto text-gray-300 mb-4" />
      )}

      <h3 className="text-lg font-semibold text-gray-500">
        No{" "}
        {type === "all"
          ? "Items"
          : type === "combined"
            ? "Services to Combine"
            : type.charAt(0).toUpperCase() + type.slice(1)}
      </h3>
      <p className="text-gray-400 mt-2">
        {type === "all"
          ? "This invoice doesn't contain any items."
          : type === "combined"
            ? "This invoice doesn't contain any services."
            : `This invoice doesn't contain any ${type}.`}
      </p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Invoice Items</span>
          <Badge variant="outline" className="ml-2">
            {allItemsWithCombinedServices.length} items
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Tabs Navigation */}
        <div className="mb-4">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Grid className="h-4 w-4" />
                All Items
                <Badge variant="secondary" className="ml-1">
                  {allItemsWithCombinedServices.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="products" className="flex items-center gap-2">
                <Box className="h-4 w-4" />
                Products
                <Badge variant="secondary" className="ml-1">
                  {productItems.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="services" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Services
                <Badge variant="secondary" className="ml-1">
                  {serviceItems.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="combined" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Combined Services
                <Badge variant="secondary" className="ml-1">
                  {combinedServices ? 1 : 0}
                </Badge>
              </TabsTrigger>
            </TabsList>

            {/* All Items Tab Content */}
            <TabsContent value="all" className="mt-4">
              {allItemsWithCombinedServices.length > 0
                ? renderItemsTable(allItemsWithCombinedServices)
                : renderEmptyState("all")}
            </TabsContent>

            {/* Products Tab Content */}
            <TabsContent value="products" className="mt-4">
              {productItems.length > 0
                ? renderItemsTable(productItems)
                : renderEmptyState("products")}
            </TabsContent>

            {/* Services Tab Content */}
            <TabsContent value="services" className="mt-4">
              {serviceItems.length > 0
                ? renderItemsTable(serviceItems)
                : renderEmptyState("services")}
            </TabsContent>

            {/* Combined Services Tab Content */}
            <TabsContent value="combined" className="mt-4">
              {combinedServices ? (
                <>
                  {renderItemsTable([
                    {
                      id: "combined-services",
                      description: combinedServices.name,
                      quantity: combinedServices.quantity,
                      unitPrice: combinedServices.unitPrice,
                      taxRate: combinedServices.weightedTaxRate,
                      itemDiscountType:
                        combinedServices.itemDiscountVal > 0
                          ? ("COMBINED" as const)
                          : null,
                      itemDiscountAmount: combinedServices.itemDiscountVal,
                      itemDiscountVal: combinedServices.itemDiscountVal,
                      discountInput: combinedServices.itemDiscountVal,
                      taxAmount: combinedServices.taxAmount,
                      amount: combinedServices.lineTotal,
                      itemType: "service",
                      grossAmount: combinedServices.grossAmount,
                      netAmount: combinedServices.netAmount,
                      lineTotal: combinedServices.lineTotal,
                      displayType: "combined-service",
                      weightedTaxRate: combinedServices.weightedTaxRate,
                      individualServices: combinedServices.services,
                    } as CombinedServiceItem,
                  ])}

                  {/* Detailed breakdown of individual services */}
                  <div className="mt-4 p-4 bg-muted/30 rounded-md">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      Individual Services Breakdown
                    </h4>
                    <div className="space-y-2">
                      {serviceItems.map((service, index) => (
                        <div
                          key={service.id}
                          className="flex justify-between items-center py-1 border-b last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                            <span className="text-sm">
                              {service.description || `Service ${index + 1}`}
                            </span>
                          </div>
                          <div className="text-sm font-medium">
                            {formatCurrency(service.lineTotal)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                renderEmptyState("combined")
              )}
            </TabsContent>
          </Tabs>
        </div>

        <Separator className="my-4" />

        {/* Summary Section - Always visible */}
        <div className="flex justify-end">
          <div className="w-80 space-y-3">
            {/* 1. Gross Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal (Gross):</span>
              <span className="font-medium">
                {formatCurrency(subtotalGross)}
              </span>
            </div>

            {/* 2. Item Discounts */}
            {totalItemDiscountMoney > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Item Discounts:</span>
                <span className="font-medium">
                  -{formatCurrency(totalItemDiscountMoney)}
                </span>
              </div>
            )}

            {/* 3. Global Discount */}
            {globalDiscountMoney > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>
                  Global Discount
                  {invoice.discountType === "PERCENTAGE" && (
                    <span className="text-xs ml-1">
                      ({globalDiscountInput}%)
                    </span>
                  )}
                  :
                </span>
                <span className="font-medium">
                  -{formatCurrency(globalDiscountMoney)}
                </span>
              </div>
            )}

            {/* 4. Taxable Amount */}
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground text-xs uppercase tracking-wide">
                Taxable Amount:
              </span>
              <span>{formatCurrency(taxableAmount)}</span>
            </div>

            {/* 5. Tax */}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Tax{" "}
                {effectiveTaxRate > 0 && `(${effectiveTaxRate.toFixed(1)}%)`}:
              </span>
              <span>{formatCurrency(finalTax)}</span>
            </div>

            {/* 6. Grand Total */}
            <div className="flex justify-between items-center pt-2 border-t text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary">{formatCurrency(finalTotal)}</span>
            </div>

            {/* 7. Deposit & Amount Due */}
            {invoice.depositRequired && depositMoney > 0 && (
              <>
                <div className="flex justify-between text-sm text-green-600 pt-2">
                  <span className="font-medium">
                    Deposit Required
                    {invoice.depositType === "PERCENTAGE" && (
                      <span className="text-xs ml-1">
                        ({Number(invoice.depositRate)}%)
                      </span>
                    )}
                    :
                  </span>
                  <span className="font-medium">
                    -{formatCurrency(depositMoney)}
                  </span>
                </div>

                <div className="flex justify-start items-center  px-3 py-2 ">
                  <span className="font-bold text-blue-600">Amount Due:</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(amountDue)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
