"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { QuotationWithRelations } from "@/types/quotation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Box, Briefcase, Layers, Grid, Package } from "lucide-react"; // Added Package icon

// Extended type for calculated items
type CalculatedItem = QuotationWithRelations["items"][0] & {
  grossAmount: number;
  itemDiscountVal: number;
  discountInputVal: number;
  netAmount: number;
  taxAmount: number;
  itemTotal: number;
  itemType: "product" | "service" | "custom";
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
  discountInputVal: number;
  taxAmount: number;
  amount: number;
  itemType: "service";
  grossAmount: number;
  netAmount: number;
  itemTotal: number;
  displayType: "combined-service";
  weightedTaxRate: number;
  individualServices?: CalculatedItem[];
  name?: string;
};

export const ItemsTable = ({
  quotation,
  combineServices,
}: {
  quotation: QuotationWithRelations;
  combineServices: boolean;
}) => {
  const [activeTab, setActiveTab] = useState<string>("all");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // --- 1. Calculate Item Level Logic (Pass 1) ---
  let subtotalGross = 0;
  let totalItemDiscountMoney = 0;

  const itemsWithCalculations: CalculatedItem[] = quotation.items.map(
    (item) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const grossAmount = quantity * unitPrice;

      // Get the input value (Percentage or Amount)
      const discountInputVal = Number(item.itemDiscountAmount || 0);

      // Calculate actual money deducted based on type
      let itemDiscountVal = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        itemDiscountVal = grossAmount * (discountInputVal / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        itemDiscountVal = discountInputVal;
      }

      // Cap discount
      itemDiscountVal = Math.min(itemDiscountVal, grossAmount);

      const netAmount = grossAmount - itemDiscountVal;
      const taxAmount = Number(item.taxAmount || 0);
      const itemTotal = netAmount + taxAmount;

      // Determine item type based on available IDs
      // If it has neither shopProductId nor serviceId, it's a custom item
      const itemType: "product" | "service" | "custom" = item.shopProductId
        ? "product"
        : item.serviceId
          ? "service"
          : "custom";

      // Accumulate totals
      subtotalGross += grossAmount;
      totalItemDiscountMoney += itemDiscountVal;

      return {
        ...item,
        grossAmount,
        itemDiscountVal, // Actual money deducted
        discountInputVal, // The % or R value typed
        netAmount,
        taxAmount,
        itemTotal,
        itemType,
      } as CalculatedItem;
    }
  );

  // --- 2. Calculate Global Discount (Pass 2) ---
  const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;
  const globalDiscountInputVal = Number(quotation.discountAmount || 0);

  let globalDiscountMoney = 0;
  if (quotation.discountType === "PERCENTAGE") {
    globalDiscountMoney =
      subtotalAfterItemDiscounts * (globalDiscountInputVal / 100);
  } else if (quotation.discountType === "AMOUNT") {
    globalDiscountMoney = globalDiscountInputVal;
  }

  globalDiscountMoney = Math.min(
    globalDiscountMoney,
    subtotalAfterItemDiscounts
  );

  // --- 3. Final Calculations ---
  const taxableAmount = subtotalAfterItemDiscounts - globalDiscountMoney;

  // Note: We use the stored tax amount from the DB because rounding differences
  // might occur if we recalculate it here on the fly without the exact same logic.
  const totalTax = Number(quotation.taxAmount || 0);

  const totalAmount = taxableAmount + totalTax;

  // Recalculate deposit to show it correctly based on total
  let depositMoney = 0;
  if (quotation.depositRequired) {
    // Check if we have a specific stored amount, otherwise calculate it
    if (quotation.depositAmount) {
      depositMoney = Number(quotation.depositAmount);
    } else if (
      quotation.depositType === "PERCENTAGE" &&
      quotation.depositRate
    ) {
      depositMoney = totalAmount * (Number(quotation.depositRate) / 100);
    }
  }

  const amountDue = totalAmount - depositMoney;

  // --- 4. Prepare data for tabs ---
  const allItems = itemsWithCalculations;

  const productItems = useMemo(() => {
    return itemsWithCalculations.filter((item) => item.itemType === "product");
  }, [itemsWithCalculations]);

  const serviceItems = useMemo(() => {
    return itemsWithCalculations.filter((item) => item.itemType === "service");
  }, [itemsWithCalculations]);

  const customItems = useMemo(() => {
    return itemsWithCalculations.filter((item) => item.itemType === "custom");
  }, [itemsWithCalculations]);

  // Combined Services calculation - only for actual services
  const combinedServices = useMemo(() => {
    if (serviceItems.length === 0) return null;

    let totalQuantity = 0;
    let totalGrossAmount = 0;
    let totalItemDiscountVal = 0;
    let totalNetAmount = 0;
    let totalTaxAmount = 0;
    let totalItemTotal = 0;
    const serviceNames: string[] = [];

    serviceItems.forEach((service) => {
      totalQuantity += Number(service.quantity);
      totalGrossAmount += service.grossAmount;
      totalItemDiscountVal += service.itemDiscountVal;
      totalNetAmount += service.netAmount;
      totalTaxAmount += service.taxAmount;
      totalItemTotal += service.itemTotal;

      if (service.description) {
        serviceNames.push(service.description);
      }
    });

    return {
      name: "Services Package",
      description:
        serviceNames.length > 0
          ? `Includes: ${serviceNames.slice(0, 3).join(", ")}${serviceNames.length > 3 ? ` and ${serviceNames.length - 3} more` : ""}`
          : "Services included in quotation",
      quantity: totalQuantity,
      unitPrice: totalQuantity > 0 ? totalGrossAmount / totalQuantity : 0,
      grossAmount: totalGrossAmount,
      itemDiscountVal: totalItemDiscountVal,
      netAmount: totalNetAmount,
      taxAmount: totalTaxAmount,
      itemTotal: totalItemTotal,
      weightedTaxRate:
        totalNetAmount > 0 ? (totalTaxAmount / totalNetAmount) * 100 : 15,
      services: serviceItems,
    };
  }, [serviceItems]);

  const allItemsWithCombinedServices = useMemo(() => {
    const items: Array<CalculatedItem | CombinedServiceItem> = [];

    // Add all products
    items.push(...productItems);

    // Add all custom items
    items.push(...customItems);

    // Add services based on combineServices setting
    if (combineServices && combinedServices) {
      // Combined view
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
        discountInputVal: combinedServices.itemDiscountVal,
        taxAmount: combinedServices.taxAmount,
        amount: combinedServices.itemTotal,
        itemType: "service",
        grossAmount: combinedServices.grossAmount,
        netAmount: combinedServices.netAmount,
        itemTotal: combinedServices.itemTotal,
        displayType: "combined-service",
        weightedTaxRate: combinedServices.weightedTaxRate,
        name: combinedServices.name,
        individualServices: combinedServices.services,
      } as CombinedServiceItem);
    } else {
      // List view - add individual services
      items.push(...serviceItems);
    }

    return items;
  }, [
    productItems,
    customItems,
    combinedServices,
    combineServices,
    serviceItems,
  ]);

  // Tab content renderers
  const renderItemsTable = (
    items: Array<CalculatedItem | CombinedServiceItem>,
    showDetailedBreakdown: boolean = false
  ) => (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-[40%]">Description</TableHead>
          <TableHead className="text-center">Qty</TableHead>
          <TableHead className="text-right">Unit Price</TableHead>
          <TableHead className="text-right">Discount</TableHead>
          <TableHead className="text-center">Tax</TableHead>
          <TableHead className="text-right">Line Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const isCombinedService =
            "displayType" in item && item.displayType === "combined-service";

          return (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div>{item.description}</div>
                <div className="text-xs text-muted-foreground mt-1 flex flex-col gap-1">
                  {isCombinedService ? (
                    <>
                      <div className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        Combined Services (
                        {(item as CombinedServiceItem).individualServices
                          ?.length || 0}{" "}
                        services)
                      </div>

                      {/* ALWAYS show individual services list under combined service */}
                      {(item as CombinedServiceItem).individualServices
                        ?.length ? (
                        <ul className="ml-4 list-disc text-[11px]">
                          {(
                            item as CombinedServiceItem
                          ).individualServices?.map((service, index) => (
                            <li key={service.id ?? index}>
                              {service.description}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  ) : "itemType" in item && item.itemType === "product" ? (
                    <div className="flex items-center gap-1">
                      <Box className="h-3 w-3" />
                      Product
                    </div>
                  ) : "itemType" in item && item.itemType === "service" ? (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      Service
                    </div>
                  ) : (
                    // Custom item
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Custom Item
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                {Number(item.quantity).toLocaleString("en-ZA")}
              </TableCell>
              <TableCell className="text-right">
                {isCombinedService ? (
                  <span className="text-muted-foreground italic">-</span>
                ) : (
                  formatCurrency(Number(item.unitPrice))
                )}
              </TableCell>
              <TableCell className="text-right text-red-600">
                {"itemDiscountVal" in item && item.itemDiscountVal > 0 ? (
                  <>
                    -{formatCurrency(item.itemDiscountVal)}
                    {"itemDiscountType" in item &&
                      item.itemDiscountType === "PERCENTAGE" && (
                        <span className="text-xs ml-1 text-muted-foreground">
                          ({item.discountInputVal}%)
                        </span>
                      )}
                    {"itemDiscountType" in item &&
                      item.itemDiscountType === "COMBINED" && (
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
                {isCombinedService
                  ? `${Number((item as CombinedServiceItem).weightedTaxRate).toFixed(1)}%`
                  : `${Number(item.taxRate) || 0}%`}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(item.itemTotal)}
              </TableCell>
            </TableRow>
          );
        })}
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
          ? "This quotation doesn't contain any items."
          : type === "combined"
            ? "This quotation doesn't contain any services."
            : `This quotation doesn't contain any ${type}.`}
      </p>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border ">
      {/* Tabs Navigation */}
      <div className="border-b ">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start h-12 rounded-none border-b-0">
            <TabsTrigger
              value="all"
              className="flex items-center gap-2  data-[state=active]:"
            >
              <Grid className="h-4 w-4" />
              All Items
              <Badge variant="secondary" className="ml-1">
                {allItemsWithCombinedServices.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="products"
              className="flex items-center gap-2  data-[state=active]:text-green-700"
            >
              <Box className="h-4 w-4" />
              Products
              <Badge variant="secondary" className="ml-1">
                {productItems.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="services"
              className="flex items-center gap-2  data-[state=active]:text-blue-700"
            >
              <Briefcase className="h-4 w-4" />
              Services
              <Badge variant="secondary" className="ml-1">
                {serviceItems.length}
              </Badge>
            </TabsTrigger>

            <TabsTrigger
              value="combined"
              className="flex items-center gap-2  data-[state=active]:text-purple-700"
            >
              <Layers className="h-4 w-4" />
              Combined Services
              <Badge variant="secondary" className="ml-1">
                {combinedServices ? 1 : 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* All Items Tab Content */}
          <TabsContent value="all" className="m-0">
            {allItemsWithCombinedServices.length > 0 ? (
              <>{renderItemsTable(allItemsWithCombinedServices)}</>
            ) : (
              renderEmptyState("all")
            )}
          </TabsContent>

          {/* Products Tab Content */}
          <TabsContent value="products" className="m-0">
            {productItems.length > 0
              ? renderItemsTable(productItems)
              : renderEmptyState("products")}
          </TabsContent>

          {/* Services Tab Content */}
          <TabsContent value="services" className="m-0">
            {serviceItems.length > 0
              ? renderItemsTable(serviceItems)
              : renderEmptyState("services")}
          </TabsContent>

          {/* Combined Services Tab Content */}
          <TabsContent value="combined" className="m-0">
            {combinedServices ? (
              <>
                {renderItemsTable(
                  [
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
                      discountInputVal: combinedServices.itemDiscountVal,
                      taxAmount: combinedServices.taxAmount,
                      amount: combinedServices.itemTotal,
                      itemType: "service",
                      grossAmount: combinedServices.grossAmount,
                      netAmount: combinedServices.netAmount,
                      itemTotal: combinedServices.itemTotal,
                      displayType: "combined-service",
                      weightedTaxRate: combinedServices.weightedTaxRate,
                      name: combinedServices.name,
                      individualServices: combinedServices.services,
                    } as CombinedServiceItem,
                  ],
                  true
                )}

                {/* Detailed breakdown of individual services */}
                <div className=" px-4 py-4 border-t ">
                  <h4 className="font-medium  mb-3 flex items-center gap-2">
                    Individual Services Breakdown
                  </h4>
                  <div className="space-y-2">
                    {serviceItems.map((service, index) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-center py-1 border-b  last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                          <span className="text-sm ">
                            {service.description || `Service ${index + 1}`}
                          </span>
                        </div>
                        <div className="text-sm ">
                          {formatCurrency(service.itemTotal)}
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

      {/* Summary Section - Always visible below tabs */}
      <div className="px-4 py-4">
        <div className="flex justify-end">
          <div className="w-80 space-y-3">
            {/* 1. Gross Subtotal */}
            <div className="flex justify-between text-sm">
              <span className="">Subtotal (Gross)</span>
              <span className="font-medium">
                {formatCurrency(subtotalGross)}
              </span>
            </div>

            {/* 2. Item Discounts */}
            {totalItemDiscountMoney > 0 && (
              <div className="flex justify-between text-sm">
                <span className="">Item Discounts</span>
                <span className="text-red-600 font-medium">
                  -{formatCurrency(totalItemDiscountMoney)}
                </span>
              </div>
            )}

            {/* 3. Global Discount */}
            {globalDiscountMoney > 0 && (
              <div className="flex justify-between text-sm">
                <span className="">
                  Global Discount
                  {quotation.discountType === "PERCENTAGE" && (
                    <span className="text-xs ml-1">
                      ({globalDiscountInputVal}%)
                    </span>
                  )}
                </span>
                <span className="text-red-600 font-medium">
                  -{formatCurrency(globalDiscountMoney)}
                </span>
              </div>
            )}

            {/* 4. Taxable Amount */}
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className=" text-xs uppercase tracking-wide">
                Taxable Amount
              </span>
              <span className="">{formatCurrency(taxableAmount)}</span>
            </div>

            {/* 5. Tax */}
            <div className="flex justify-between text-sm">
              <span className="">Tax</span>
              <span className="">{formatCurrency(totalTax)}</span>
            </div>

            {/* 6. Grand Total */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className="font-bold ">Total</span>
              <span className="font-bold text-xl text-primary">
                {formatCurrency(totalAmount)}
              </span>
            </div>

            {/* 7. Deposit & Amount Due */}
            {quotation.depositRequired && depositMoney > 0 && (
              <>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-green-600 font-medium">
                    Deposit Required
                    {quotation.depositType === "PERCENTAGE" && (
                      <span className="text-xs ml-1">
                        ({Number(quotation.depositRate)}%)
                      </span>
                    )}
                  </span>
                  <span className="text-green-600 font-medium">
                    -{formatCurrency(depositMoney)}
                  </span>
                </div>

                <div className="flex justify-between items-center bg-muted/30 px-2 py-2 rounded">
                  <span className="font-bold">Amount Due</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(amountDue)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
