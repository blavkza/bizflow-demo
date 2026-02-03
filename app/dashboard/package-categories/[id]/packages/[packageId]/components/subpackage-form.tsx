"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Calculator,
  Clock,
  Check,
  Loader2,
  DollarSign,
  Percent,
  Search,
  FileText,
  Briefcase,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Subpackage form schema with discount validation
const subpackageFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    originalPrice: z.coerce
      .number()
      .min(0, "Original price must be 0 or greater"),
    discountType: z.enum(["percentage", "amount", "none"]).default("none"),
    discountValue: z.coerce
      .number()
      .min(0, "Discount must be 0 or greater")
      .optional(),
    discountPercentage: z.coerce
      .number()
      .min(0)
      .max(100, "Discount percentage cannot exceed 100%")
      .optional(),
    finalPrice: z.coerce.number().min(0, "Price must be 0 or greater"),
    duration: z.string().optional(),
    isDefault: z.boolean().default(false),
    sortOrder: z.coerce.number().default(0),
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE"]).default("DRAFT"),
  })
  .refine(
    (data) => {
      if (data.discountType === "percentage" && !data.discountPercentage) {
        return false;
      }
      if (data.discountType === "amount" && !data.discountValue) {
        return false;
      }
      return true;
    },
    {
      message: "Discount value is required when discount type is selected",
      path: ["discountValue"],
    }
  );

export type SubPackageFormValues = z.infer<typeof subpackageFormSchema>;

export type SelectedItem = {
  id: string;
  name: string;
  type: "product" | "service";
  price: number;
  unitPrice: number;
  quantity: number;
  amount: number;
  duration?: string;
  category?: string;
  sku?: string;
  image?: string;
  description?: string;
  itemDiscountType?: "AMOUNT" | "PERCENTAGE";
  itemDiscountAmount?: number;
  taxRate: number;
  taxAmount?: number;
};

type SearchableItem = {
  id: string;
  name: string;
  type: "product" | "service";
  price: number;
  category?: string;
  duration?: string;
  features?: string[];
  sku?: string;
  description?: string | null;
  image?: string | null;
};

interface SubpackageFormProps {
  mode: "create" | "edit";
  packageId?: string;
  subpackageData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Helper function to extract text from HTML
const extractTextFromHTML = (html: string | null | undefined): string => {
  if (!html) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || "";
};

// Helper function to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(amount);
};

// Safe number conversion
const safeNumber = (val: any) => (val ? Number(val) : 0);

// SearchableItemInput Component
interface SearchableItemInputProps {
  index: number;
  searchTerm: string;
  searchableItems: SearchableItem[];
  selectedItems: SelectedItem[];
  showDropdown: number | null;
  onSearchChange: (index: number, value: string) => void;
  onFocus: (index: number) => void;
  onBlur: () => void;
  onSelect: (index: number, item: SearchableItem) => void;
  setShowDropdown: (index: number | null) => void;
}

const SearchableItemInput = ({
  index,
  searchTerm,
  searchableItems,
  selectedItems,
  showDropdown,
  onSearchChange,
  onFocus,
  onBlur,
  onSelect,
  setShowDropdown,
}: SearchableItemInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const filteredItems = useMemo(() => {
    return searchableItems.filter((item) => {
      // Check if this item is already in selectedItems (excluding current index)
      const isAlreadySelected = selectedItems.some(
        (selected, i) =>
          i !== index && selected.id === item.id && selected.type === item.type
      );

      if (isAlreadySelected) return false;

      const searchLower = searchTerm.toLowerCase();
      const matchesName = item.name.toLowerCase().includes(searchLower);
      const matchesSku = item.sku?.toLowerCase().includes(searchLower) || false;
      const matchesCategory =
        item.category?.toLowerCase().includes(searchLower) || false;
      const descriptionText = extractTextFromHTML(item.description);
      const matchesDescription = descriptionText
        .toLowerCase()
        .includes(searchLower);

      return matchesName || matchesSku || matchesCategory || matchesDescription;
    });
  }, [searchableItems, searchTerm, selectedItems, index]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown !== index) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;

      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredItems.length) {
          onSelect(index, filteredItems[selectedIndex]);
          setSelectedIndex(-1);
        }
        break;

      case "Escape":
        setSelectedIndex(-1);
        setShowDropdown(null);
        break;
    }
  };

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchTerm]);

  // Update input ref value
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = searchTerm;
    }
  }, [searchTerm]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          placeholder="Search products/services by name, SKU, description, or category..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
          defaultValue={searchTerm}
          onChange={(e) => {
            onSearchChange(index, e.target.value);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            onFocus(index);
            setSelectedIndex(-1);
          }}
          onBlur={() => {
            setTimeout(() => {
              onBlur();
              setSelectedIndex(-1);
            }, 200);
          }}
        />
      </div>

      {showDropdown === index && filteredItems.length > 0 && (
        <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md max-h-96 overflow-auto">
          <div className="p-1">
            {filteredItems.slice(0, 10).map((item, itemIndex) => {
              const descriptionText = extractTextFromHTML(item.description);

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={cn(
                    "flex items-start p-2 hover:bg-accent rounded-sm cursor-pointer border-b last:border-0 gap-3",
                    selectedIndex === itemIndex && "bg-accent"
                  )}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(index, item);
                    setSelectedIndex(-1);
                  }}
                >
                  {item.image ? (
                    <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border bg-muted">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-12 h-12 rounded-md border bg-muted flex items-center justify-center">
                      <div className="text-muted-foreground">
                        {item.type === "product" ? (
                          <FileText className="h-5 w-5" />
                        ) : (
                          <Briefcase className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block">
                          {item.name}
                        </span>
                        {item.sku && (
                          <span className="text-[10px] font-mono bg-muted px-1 rounded mt-0.5 inline-block">
                            SKU: {item.sku}
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground flex-shrink-0 ml-2">
                        {formatCurrency(item.price)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                      <span>
                        {item.type === "product" ? "Product" : "Service"}
                        {item.category && ` • ${item.category}`}
                      </span>
                      {item.duration && <span>{item.duration}</span>}
                    </div>

                    {descriptionText && (
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {descriptionText}
                      </div>
                    )}

                    {item.features && item.features.length > 0 && (
                      <div className="text-[10px] text-muted-foreground mt-1 italic truncate">
                        • Includes: {item.features.join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showDropdown === index && filteredItems.length === 0 && searchTerm && (
        <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md p-4">
          <div className="text-center text-sm text-muted-foreground">
            {searchableItems.some(
              (item) =>
                selectedItems.some(
                  (selected, i) =>
                    i !== index &&
                    selected.id === item.id &&
                    selected.type === item.type
                ) &&
                (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  item.category
                    ?.toLowerCase()
                    .includes(searchTerm.toLowerCase()))
            ) ? (
              <div>
                <p className="font-medium">Item already added</p>
                <p className="text-xs mt-1">
                  This item is already in the subpackage
                </p>
              </div>
            ) : (
              <p>No matching items found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Tax Calculation Display Component
const TaxCalculationDisplay = ({
  item,
  index,
}: {
  item: SelectedItem;
  index: number;
}) => {
  if (!item.name || item.unitPrice === 0) return null;

  const qty = safeNumber(item.quantity);
  const price = safeNumber(item.unitPrice);
  const taxRate = safeNumber(item.taxRate);
  const discInput = safeNumber(item.itemDiscountAmount);

  // Calculate base amount
  const baseAmount = qty * price;

  // Calculate discount
  let discountAmount = 0;
  if (item.itemDiscountType === "PERCENTAGE") {
    discountAmount = baseAmount * (discInput / 100);
  } else if (item.itemDiscountType === "AMOUNT") {
    discountAmount = discInput;
  }
  discountAmount = Math.min(discountAmount, baseAmount);

  // Calculate net amount (after discount)
  const netAmount = Math.max(0, baseAmount - discountAmount);

  // Calculate tax
  const taxAmount = netAmount * (taxRate / 100);

  // Calculate total (net + tax)
  const totalAmount = netAmount + taxAmount;

  return (
    <div className="mt-2 p-3 bg-muted/30 rounded-md text-xs space-y-1">
      <div className="flex justify-between">
        <span className="font-medium">Tax Calculation Breakdown:</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3 w-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <p>
                  Base: {qty} × {formatCurrency(price)} ={" "}
                  {formatCurrency(baseAmount)}
                </p>
                <p>Discount: {formatCurrency(discountAmount)}</p>
                <p>
                  Net: {formatCurrency(baseAmount)} -{" "}
                  {formatCurrency(discountAmount)} = {formatCurrency(netAmount)}
                </p>
                <p>
                  Tax: {formatCurrency(netAmount)} × {taxRate}% ={" "}
                  {formatCurrency(taxAmount)}
                </p>
                <p>
                  Total: {formatCurrency(netAmount)} +{" "}
                  {formatCurrency(taxAmount)} = {formatCurrency(totalAmount)}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-2 gap-1">
        <div className="text-muted-foreground">Base Amount:</div>
        <div className="text-right">{formatCurrency(baseAmount)}</div>

        {discountAmount > 0 && (
          <>
            <div className="text-muted-foreground">Discount:</div>
            <div className="text-right text-red-600">
              -{formatCurrency(discountAmount)}
            </div>
          </>
        )}

        <div className="text-muted-foreground">Net Amount:</div>
        <div className="text-right font-medium">
          {formatCurrency(netAmount)}
        </div>

        <div className="text-muted-foreground">Tax ({taxRate}%):</div>
        <div className="text-right">{formatCurrency(taxAmount)}</div>

        <div className="font-medium">Total:</div>
        <div className="text-right font-bold">
          {formatCurrency(totalAmount)}
        </div>
      </div>
    </div>
  );
};

export function SubpackageForm({
  mode,
  packageId,
  subpackageData,
  onSuccess,
  onCancel,
}: SubpackageFormProps) {
  const [loading, setLoading] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [searchableItems, setSearchableItems] = useState<SearchableItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [searchInputs, setSearchInputs] = useState<{ [key: number]: string }>(
    {}
  );
  const [showDropdown, setShowDropdown] = useState<number | null>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [autoCalculatedPrice, setAutoCalculatedPrice] = useState<number | null>(
    null
  );
  const [useAutoPrice, setUseAutoPrice] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showTaxBreakdown, setShowTaxBreakdown] = useState<number | null>(null);

  const form = useForm<SubPackageFormValues>({
    resolver: zodResolver(subpackageFormSchema),
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      originalPrice: 0,
      discountType: "none",
      discountValue: 0,
      discountPercentage: 0,
      finalPrice: 0,
      duration: "",
      isDefault: false,
      sortOrder: 0,
      status: "DRAFT",
    },
  });

  // Watch form values for calculations
  const originalPrice = form.watch("originalPrice");
  const discountType = form.watch("discountType");
  const discountValue = form.watch("discountValue");
  const discountPercentage = form.watch("discountPercentage");

  // Calculate total cost of selected items with detailed breakdown
  const calculateTotalCost = useCallback(() => {
    return selectedItems.reduce((total, item) => {
      if (!item.name || item.unitPrice === 0) return total;

      const qty = safeNumber(item.quantity);
      const price = safeNumber(item.unitPrice);
      const taxRate = safeNumber(item.taxRate);
      const discInput = safeNumber(item.itemDiscountAmount);

      const base = qty * price;
      let disc = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        disc = base * (discInput / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        disc = discInput;
      }
      disc = Math.min(disc, base);
      const net = Math.max(0, base - disc);

      const tax = net * (taxRate / 100);
      return total + net + tax;
    }, 0);
  }, [selectedItems]);

  // Calculate detailed tax summary
  const calculateTaxSummary = useCallback(() => {
    const summary = {
      subtotal: 0,
      totalDiscount: 0,
      taxableAmount: 0,
      totalTax: 0,
      grandTotal: 0,
      taxByRate: {} as Record<number, { amount: number; taxable: number }>,
    };

    selectedItems.forEach((item) => {
      if (!item.name || item.unitPrice === 0) return;

      const qty = safeNumber(item.quantity);
      const price = safeNumber(item.unitPrice);
      const taxRate = safeNumber(item.taxRate);
      const discInput = safeNumber(item.itemDiscountAmount);

      const base = qty * price;
      let disc = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        disc = base * (discInput / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        disc = discInput;
      }
      disc = Math.min(disc, base);
      const net = Math.max(0, base - disc);

      const tax = net * (taxRate / 100);

      summary.subtotal += base;
      summary.totalDiscount += disc;
      summary.taxableAmount += net;
      summary.totalTax += tax;
      summary.grandTotal += net + tax;

      // Group tax by rate
      if (!summary.taxByRate[taxRate]) {
        summary.taxByRate[taxRate] = { amount: 0, taxable: 0 };
      }
      summary.taxByRate[taxRate].amount += tax;
      summary.taxByRate[taxRate].taxable += net;
    });

    return summary;
  }, [selectedItems]);

  // Calculate final price based on discount
  const calculateFinalPrice = useCallback(() => {
    let basePrice = originalPrice || 0;

    if (discountType === "percentage" && discountPercentage) {
      return basePrice * (1 - discountPercentage / 100);
    } else if (discountType === "amount" && discountValue) {
      return Math.max(0, basePrice - discountValue);
    }

    return basePrice;
  }, [originalPrice, discountType, discountPercentage, discountValue]);

  // Update auto-calculated price whenever selected items change
  useEffect(() => {
    if (selectedItems.length === 0) return;

    const total = calculateTotalCost();
    setAutoCalculatedPrice(total);

    // Auto-fill original price field if useAutoPrice is true
    if (useAutoPrice && total > 0) {
      form.setValue("originalPrice", total);
      const finalPrice = calculateFinalPrice();
      form.setValue("finalPrice", finalPrice);
    }
  }, [
    selectedItems,
    calculateTotalCost,
    useAutoPrice,
    form,
    calculateFinalPrice,
  ]);

  // Update final price when discount or original price changes
  useEffect(() => {
    const finalPrice = calculateFinalPrice();
    form.setValue("finalPrice", finalPrice);
  }, [
    originalPrice,
    discountType,
    discountValue,
    discountPercentage,
    calculateFinalPrice,
    form,
  ]);

  // Calculate row net total
  const getRowNetTotal = (index: number) => {
    const item = selectedItems[index];
    if (!item || !item.name || item.unitPrice === 0) return 0;

    const qty = safeNumber(item.quantity);
    const price = safeNumber(item.unitPrice);
    const taxRate = safeNumber(item.taxRate);
    const discInput = safeNumber(item.itemDiscountAmount);

    const base = qty * price;
    let disc = 0;
    if (item.itemDiscountType === "PERCENTAGE") {
      disc = base * (discInput / 100);
    } else if (item.itemDiscountType === "AMOUNT") {
      disc = discInput;
    }
    disc = Math.min(disc, base);
    const net = Math.max(0, base - disc);

    const tax = net * (taxRate / 100);
    return net + tax;
  };

  // Calculate detailed breakdown for a specific item
  const getItemBreakdown = (index: number) => {
    const item = selectedItems[index];
    if (!item || !item.name || item.unitPrice === 0) return null;

    const qty = safeNumber(item.quantity);
    const price = safeNumber(item.unitPrice);
    const taxRate = safeNumber(item.taxRate);
    const discInput = safeNumber(item.itemDiscountAmount);

    const base = qty * price;
    let disc = 0;
    if (item.itemDiscountType === "PERCENTAGE") {
      disc = base * (discInput / 100);
    } else if (item.itemDiscountType === "AMOUNT") {
      disc = discInput;
    }
    disc = Math.min(disc, base);
    const net = Math.max(0, base - disc);
    const tax = net * (taxRate / 100);
    const total = net + tax;

    return {
      quantity: qty,
      unitPrice: price,
      baseAmount: base,
      discountAmount: disc,
      netAmount: net,
      taxRate: taxRate,
      taxAmount: tax,
      totalAmount: total,
    };
  };

  // Calculate item discount amount
  const getItemDiscountAmount = (index: number) => {
    const item = selectedItems[index];
    if (!item || !item.itemDiscountType) return 0;

    const base = item.unitPrice * item.quantity;
    if (item.itemDiscountType === "PERCENTAGE" && item.itemDiscountAmount) {
      return base * (item.itemDiscountAmount / 100);
    } else if (item.itemDiscountType === "AMOUNT" && item.itemDiscountAmount) {
      return item.itemDiscountAmount;
    }
    return 0;
  };

  // Load existing data for edit mode - FIXED VERSION
  useEffect(() => {
    if (mode === "edit" && subpackageData && !hasInitialized) {
      console.log("Initializing edit mode with data:", subpackageData);

      let discountType: "percentage" | "amount" | "none" = "none";
      let discountValue = 0;
      let discountPercentage = 0;
      let finalPrice = subpackageData.price || 0;
      let originalPrice =
        subpackageData.originalPrice || subpackageData.price || 0;

      if (subpackageData.discount) {
        if (subpackageData.discount <= 100) {
          discountType = "percentage";
          discountPercentage = subpackageData.discount;
          finalPrice = originalPrice * (1 - subpackageData.discount / 100);
        } else {
          discountType = "amount";
          discountValue = subpackageData.discount;
          finalPrice = Math.max(0, originalPrice - subpackageData.discount);
        }
      }

      form.reset({
        name: subpackageData.name || "",
        description: subpackageData.description || "",
        shortDescription: subpackageData.shortDescription || "",
        originalPrice: originalPrice,
        discountType: discountType,
        discountValue: discountType === "amount" ? discountValue : 0,
        discountPercentage:
          discountType === "percentage" ? discountPercentage : 0,
        finalPrice: finalPrice,
        duration: subpackageData.duration || "",
        isDefault: subpackageData.isDefault || false,
        sortOrder: subpackageData.sortOrder || 0,
        status: subpackageData.status || "DRAFT",
      });

      // Load existing items
      const existingItems: SelectedItem[] = [];
      const searchInputsObj: { [key: number]: string } = {};

      // Helper function to add items from array
      const addItemsFromArray = (items: any[], type: "product" | "service") => {
        if (items && items.length > 0) {
          items.forEach((item) => {
            const currentIndex = existingItems.length;

            // Extract item data - handle both nested and flat structures
            const itemData = item.product || item.service || item;

            const selectedItem: SelectedItem = {
              id: itemData.id || item.id,
              name: itemData.name || item.name || "",
              type: type,
              price: Number(
                item.unitPrice || item.price || itemData.price || 0
              ),
              unitPrice: Number(
                item.unitPrice || item.price || itemData.price || 0
              ),
              quantity: item.quantity || 1,
              amount:
                Number(item.unitPrice || item.price || itemData.price || 0) *
                (item.quantity || 1),
              duration: itemData.duration || item.duration,
              category: itemData.category,
              sku: itemData.sku,
              image: itemData.image || item.image,
              description: itemData.description || item.description,
              itemDiscountType: item.itemDiscountType,
              itemDiscountAmount: item.itemDiscountAmount
                ? Number(item.itemDiscountAmount)
                : 0,
              taxRate: item.taxRate ? Number(item.taxRate) : 15,
              taxAmount: item.taxAmount ? Number(item.taxAmount) : 0,
            };

            existingItems.push(selectedItem);
            searchInputsObj[currentIndex] = selectedItem.name;
          });
        }
      };

      // Load products
      console.log("Loading products:", subpackageData.products);
      addItemsFromArray(subpackageData.products || [], "product");

      // Load services
      console.log("Loading services:", subpackageData.services);
      addItemsFromArray(subpackageData.services || [], "service");

      console.log("Existing items loaded:", existingItems);
      console.log("Search inputs:", searchInputsObj);

      // Only set state if we have items
      if (existingItems.length > 0) {
        setSelectedItems(existingItems);
        setSearchInputs(searchInputsObj);
        setHasInitialized(true);
      } else {
        // Add empty item for create mode
        setSelectedItems([
          {
            id: "",
            name: "",
            type: "product",
            price: 0,
            unitPrice: 0,
            quantity: 1,
            amount: 0,
            taxRate: 15,
            itemDiscountType: undefined,
            itemDiscountAmount: 0,
            taxAmount: 0,
          },
        ]);
        setSearchInputs({ 0: "" });
      }

      // Load existing features
      setFeatures(subpackageData.features || []);
    }
  }, [mode, subpackageData, form, hasInitialized]);

  // Initialize for create mode
  useEffect(() => {
    if (mode === "create" && !hasInitialized) {
      setSelectedItems([
        {
          id: "",
          name: "",
          type: "product",
          price: 0,
          unitPrice: 0,
          quantity: 1,
          amount: 0,
          taxRate: 15,
          itemDiscountType: undefined,
          itemDiscountAmount: 0,
          taxAmount: 0,
        },
      ]);
      setSearchInputs({ 0: "" });
      setHasInitialized(true);
    }
  }, [mode, hasInitialized]);

  // Fetch items for search
  const fetchItems = useCallback(async () => {
    setIsLoadingItems(true);
    try {
      const [productsResponse, servicesResponse] = await Promise.all([
        axios.get("/api/shop/products/pos"),
        axios.get("/api/services"),
      ]);

      const products: any[] = productsResponse?.data || [];
      const services: any[] = servicesResponse?.data || [];

      const combinedItems: SearchableItem[] = [
        ...products.map((product) => {
          let firstImage: string | undefined;
          if (product.images) {
            try {
              const imagesData =
                typeof product.images === "string"
                  ? JSON.parse(product.images)
                  : product.images;
              if (Array.isArray(imagesData) && imagesData.length > 0) {
                if (typeof imagesData[0] === "string") {
                  firstImage = imagesData[0];
                } else if (imagesData[0]?.url) {
                  firstImage = imagesData[0].url;
                }
              }
            } catch (error) {
              console.warn("Error parsing images:", error);
            }
          }

          return {
            id: product.id,
            name: product.name,
            type: "product" as const,
            price: Number(product.price || 0),
            category: product.category,
            sku: product.sku,
            description: product.description,
            image: firstImage,
          };
        }),
        ...services.map((service) => ({
          id: service.id,
          name: service.name,
          type: "service" as const,
          price: Number(service.amount || 0),
          category: service.category,
          duration: service.duration,
          features: service.features,
          description: service.description,
          image: service.image,
        })),
      ];
      setSearchableItems(combinedItems);
    } catch (err) {
      console.error("Error fetching items:", err);
      toast.error("Failed to load products and services");
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle search input change
  const handleSearchInputChange = (index: number, value: string) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));

    // Only update the item name if we're not clearing it
    const newItems = [...selectedItems];
    if (newItems[index]) {
      if (value === "") {
        // Clear the entire item if search is empty
        newItems[index] = {
          id: "",
          name: "",
          type: "product",
          price: 0,
          unitPrice: 0,
          quantity: 1,
          amount: 0,
          taxRate: 15,
          itemDiscountType: undefined,
          itemDiscountAmount: 0,
          taxAmount: 0,
        };
      } else if (!newItems[index].id) {
        // Only update name if it's not a selected item yet
        newItems[index] = { ...newItems[index], name: value };
      }
    }
    setSelectedItems(newItems);

    if (value.length > 0) {
      setShowDropdown(index);
    } else {
      setShowDropdown(null);
    }
  };

  // Handle item selection with duplicate check
  const handleItemSelect = (index: number, item: SearchableItem) => {
    // Check if item is already selected (excluding current index)
    const isDuplicate = selectedItems.some(
      (selectedItem, i) =>
        i !== index &&
        selectedItem.id === item.id &&
        selectedItem.type === item.type
    );

    if (isDuplicate) {
      toast.error("This item is already added to the subpackage", {
        description: "Each product/service can only be added once.",
      });
      return;
    }

    setSearchInputs((prev) => ({ ...prev, [index]: item.name }));

    const selectedItem: SelectedItem = {
      id: item.id,
      name: item.name,
      type: item.type,
      price: item.price,
      unitPrice: item.price,
      quantity: 1,
      amount: item.price,
      duration: item.duration,
      category: item.category,
      sku: item.sku,
      image: item.image || undefined,
      description: item.description || undefined,
      taxRate: 15,
      itemDiscountType: undefined,
      itemDiscountAmount: 0,
      taxAmount: item.price * 0.15,
    };

    const newItems = [...selectedItems];
    newItems[index] = selectedItem;
    setSelectedItems(newItems);

    setShowDropdown(null);
  };

  // Handle search focus
  const handleSearchFocus = (index: number) => {
    const currentValue = searchInputs[index] || "";
    if (currentValue.length > 0) {
      setShowDropdown(index);
    }
  };

  // Handle search blur
  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowDropdown(null);
    }, 200);
  };

  // Add item
  const addItem = () => {
    const newIndex = selectedItems.length;
    setSelectedItems([
      ...selectedItems,
      {
        id: "",
        name: "",
        type: "product",
        price: 0,
        unitPrice: 0,
        quantity: 1,
        amount: 0,
        taxRate: 15,
        itemDiscountType: undefined,
        itemDiscountAmount: 0,
        taxAmount: 0,
      },
    ]);
    setSearchInputs((prev) => ({ ...prev, [newIndex]: "" }));
  };

  // Update item field
  const handleUpdateItemField = <K extends keyof SelectedItem>(
    index: number,
    field: K,
    value: SelectedItem[K]
  ) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    if (selectedItems.length <= 1) {
      // If it's the last item, just clear it
      const newItems = [...selectedItems];
      newItems[index] = {
        id: "",
        name: "",
        type: "product",
        price: 0,
        unitPrice: 0,
        quantity: 1,
        amount: 0,
        taxRate: 15,
        itemDiscountType: undefined,
        itemDiscountAmount: 0,
        taxAmount: 0,
      };
      setSelectedItems(newItems);
      setSearchInputs((prev) => ({ ...prev, [index]: "" }));
    } else {
      const newItems = selectedItems.filter((_, i) => i !== index);
      setSelectedItems(newItems);

      const newSearchInputs = { ...searchInputs };
      delete newSearchInputs[index];

      // Reindex remaining inputs
      const reindexedInputs: { [key: number]: string } = {};
      Object.entries(newSearchInputs).forEach(([key, value], newIndex) => {
        reindexedInputs[newIndex] = value;
      });

      setSearchInputs(reindexedInputs);
    }
  };

  // Calculate total tax amount from selected items
  const calculateTotalTax = useCallback(() => {
    return selectedItems.reduce((total, item) => {
      if (!item.name || item.unitPrice === 0) return total;

      const qty = safeNumber(item.quantity);
      const price = safeNumber(item.unitPrice);
      const taxRate = safeNumber(item.taxRate);
      const discInput = safeNumber(item.itemDiscountAmount);

      const base = qty * price;
      let disc = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        disc = base * (discInput / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        disc = discInput;
      }
      disc = Math.min(disc, base);
      const net = Math.max(0, base - disc);

      const tax = net * (taxRate / 100);
      return total + tax;
    }, 0);
  }, [selectedItems]);

  // Calculate subtotal (before tax and discounts)
  const calculateSubtotal = useCallback(() => {
    return selectedItems.reduce((total, item) => {
      if (!item.name || item.unitPrice === 0) return total;
      return total + item.unitPrice * item.quantity;
    }, 0);
  }, [selectedItems]);

  // Calculate total discounts from items
  const calculateTotalItemDiscounts = useCallback(() => {
    return selectedItems.reduce((total, item) => {
      if (!item.name || !item.itemDiscountType) return total;

      const base = item.unitPrice * item.quantity;
      if (item.itemDiscountType === "PERCENTAGE" && item.itemDiscountAmount) {
        return total + base * (item.itemDiscountAmount / 100);
      } else if (
        item.itemDiscountType === "AMOUNT" &&
        item.itemDiscountAmount
      ) {
        return total + item.itemDiscountAmount;
      }
      return total;
    }, 0);
  }, [selectedItems]);

  // Calculate net total (after item discounts but before tax)
  const calculateNetTotal = useCallback(() => {
    return calculateSubtotal() - calculateTotalItemDiscounts();
  }, [calculateSubtotal, calculateTotalItemDiscounts]);

  // Add these calculations to the component
  const subtotal = calculateSubtotal();
  const totalItemDiscounts = calculateTotalItemDiscounts();
  const netTotal = calculateNetTotal();
  const totalTax = calculateTotalTax();
  const grandTotal = calculateTotalCost();

  // Handle feature management
  const addFeature = () => {
    const trimmedFeature = featureInput.trim();
    if (trimmedFeature && !features.includes(trimmedFeature)) {
      setFeatures([...features, trimmedFeature]);
      setFeatureInput("");
    }
  };

  const removeFeature = (featureToRemove: string) => {
    setFeatures(features.filter((feature) => feature !== featureToRemove));
  };

  // Handle form submission
  const onSubmit = async (values: SubPackageFormValues) => {
    try {
      setLoading(true);

      // Filter out empty items
      const validItems = selectedItems.filter((item) => item.name && item.id);

      if (validItems.length === 0) {
        toast.error("Please add at least one item to the subpackage");
        return;
      }

      // Check for duplicates (in case somehow they got through)
      const itemIds = new Set();
      const duplicates = validItems.filter((item) => {
        const key = `${item.type}-${item.id}`;
        if (itemIds.has(key)) {
          return true;
        }
        itemIds.add(key);
        return false;
      });

      if (duplicates.length > 0) {
        toast.error("Duplicate items found", {
          description: "Please remove duplicate items before submitting.",
        });
        return;
      }

      let discountData = {};
      if (values.discountType === "percentage") {
        discountData = { discount: values.discountPercentage };
      } else if (values.discountType === "amount") {
        discountData = { discount: values.discountValue };
      }

      const data = {
        ...values,
        price: values.finalPrice,
        originalPrice: values.originalPrice,
        ...discountData,
        features,
        products: validItems
          .filter((item) => item.type === "product")
          .map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            itemDiscountType: item.itemDiscountType,
            itemDiscountAmount: item.itemDiscountAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
          })),
        services: validItems
          .filter((item) => item.type === "service")
          .map((item) => ({
            id: item.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            itemDiscountType: item.itemDiscountType,
            itemDiscountAmount: item.itemDiscountAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
          })),
        packageId,
      };

      console.log("Submitting data:", data);

      let response;
      if (mode === "edit" && subpackageData) {
        response = await axios.put(
          `/api/subpackages/${subpackageData.id}`,
          data
        );
        toast.success("Subpackage updated successfully!");
      } else {
        response = await axios.post("/api/subpackages", data);
        toast.success("Subpackage created successfully!");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error(`Error ${mode} subpackage:`, error);
      toast.error(`Failed to ${mode} subpackage`, {
        description: error.response?.data?.error || "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply auto-calculated price
  const applyAutoPrice = () => {
    if (autoCalculatedPrice !== null && autoCalculatedPrice > 0) {
      form.setValue("originalPrice", autoCalculatedPrice);
      const finalPrice = calculateFinalPrice();
      form.setValue("finalPrice", finalPrice);
      setUseAutoPrice(true);
    }
  };

  // Handle manual original price change
  const handleOriginalPriceChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    form.setValue("originalPrice", numValue);

    if (
      autoCalculatedPrice !== null &&
      Math.abs(numValue - autoCalculatedPrice) > 0.01
    ) {
      setUseAutoPrice(false);
    } else if (numValue === 0 && selectedItems.length === 0) {
      setUseAutoPrice(true);
    }
  };

  // Get discount summary text
  const getDiscountSummary = () => {
    if (discountType === "percentage" && discountPercentage) {
      return `${discountPercentage}% off`;
    } else if (discountType === "amount" && discountValue) {
      return `${formatCurrency(discountValue)} off`;
    }
    return "No discount";
  };

  // Calculate savings amount
  const calculateSavings = () => {
    if (discountType === "percentage" && discountPercentage && originalPrice) {
      return originalPrice * (discountPercentage / 100);
    } else if (discountType === "amount" && discountValue) {
      return discountValue;
    }
    return 0;
  };

  // Calculate tax summary for display
  const taxSummary = calculateTaxSummary();

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subpackage Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Basic Plan, Professional Plan"
                          {...field}
                          disabled={loading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field}
                          disabled={loading}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what this subpackage includes..."
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ""}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Products & Services Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Subpackage Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Search for products or services, or type custom descriptions
                  </p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {selectedItems.filter((item) => item.name).length} items
                </Badge>
              </div>

              {/* Items Header */}
              <div className="grid grid-cols-12 gap-3 mb-3 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium">
                <div className="col-span-4">Description</div>
                <div className="col-span-1 text-center">Qty</div>
                <div className="col-span-2 text-center">Price</div>
                <div className="col-span-1 text-center">Discount</div>
                <div className="col-span-1 text-center">Tax %</div>
                <div className="col-span-2 text-center">Total</div>
                <div className="col-span-1"></div>
              </div>

              {/* Items List */}
              <div className="space-y-3">
                {selectedItems.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg bg-background hover:bg-muted/30 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-3 items-center p-4">
                      {/* Searchable Item Input - Column 1 */}
                      <div className="col-span-4">
                        <SearchableItemInput
                          index={index}
                          searchTerm={searchInputs[index] || ""}
                          searchableItems={searchableItems}
                          selectedItems={selectedItems}
                          showDropdown={showDropdown}
                          onSearchChange={handleSearchInputChange}
                          onFocus={handleSearchFocus}
                          onBlur={handleSearchBlur}
                          onSelect={handleItemSelect}
                          setShowDropdown={setShowDropdown}
                        />
                      </div>

                      {/* Quantity - Column 2 */}
                      <div className="col-span-1">
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            step="1"
                            className="text-center"
                            value={item.quantity}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              const finalValue = isNaN(value) ? 1 : value;
                              handleUpdateItemField(
                                index,
                                "quantity",
                                finalValue
                              );
                            }}
                            disabled={loading || !item.name}
                          />
                        </FormControl>
                      </div>

                      {/* Unit Price - Column 3 */}
                      <div className="col-span-2">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            className="text-left"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const value =
                                e.target.valueAsNumber ||
                                parseFloat(e.target.value) ||
                                0;
                              handleUpdateItemField(index, "unitPrice", value);
                            }}
                            disabled={loading || !item.name}
                          />
                        </FormControl>
                      </div>

                      {/* Item Discount - Column 4 */}
                      <div className="col-span-1 space-y-1">
                        <Select
                          value={item.itemDiscountType || ""}
                          onValueChange={(value: "AMOUNT" | "PERCENTAGE") => {
                            handleUpdateItemField(
                              index,
                              "itemDiscountType",
                              value
                            );
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AMOUNT">R</SelectItem>
                            <SelectItem value="PERCENTAGE">%</SelectItem>
                          </SelectContent>
                        </Select>

                        {item.itemDiscountType && (
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step={
                                item.itemDiscountType === "PERCENTAGE"
                                  ? "0.1"
                                  : "0.01"
                              }
                              placeholder="0.00"
                              className="h-8 text-center text-xs"
                              value={item.itemDiscountAmount || ""}
                              onChange={(e) => {
                                const input = e.target.value;
                                if (input === "") {
                                  handleUpdateItemField(
                                    index,
                                    "itemDiscountAmount",
                                    0
                                  );
                                  return;
                                }
                                let value = parseFloat(input);
                                if (isNaN(value)) {
                                  handleUpdateItemField(
                                    index,
                                    "itemDiscountAmount",
                                    0
                                  );
                                  return;
                                }
                                if (
                                  item.itemDiscountType === "PERCENTAGE" &&
                                  value > 100
                                ) {
                                  value = 100;
                                }
                                handleUpdateItemField(
                                  index,
                                  "itemDiscountAmount",
                                  value
                                );
                              }}
                              disabled={loading || !item.name}
                            />
                          </FormControl>
                        )}
                      </div>

                      {/* Tax Rate - Column 5 */}
                      <div className="col-span-1">
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            className="text-center"
                            value={item.taxRate || ""}
                            onChange={(e) => {
                              const value =
                                e.target.value === ""
                                  ? 0
                                  : parseFloat(e.target.value);
                              handleUpdateItemField(index, "taxRate", value);
                            }}
                            disabled={loading || !item.name}
                          />
                        </FormControl>
                      </div>

                      {/* Item Total (Display Only) - Column 6 */}
                      <div className="col-span-2 text-center">
                        <div className="text-sm font-medium">
                          {formatCurrency(getRowNetTotal(index))}
                        </div>
                        {getItemDiscountAmount(index) > 0 && (
                          <div className="text-xs text-red-600">
                            -{formatCurrency(getItemDiscountAmount(index))}
                          </div>
                        )}
                      </div>

                      {/* Remove Button - Column 7 */}
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(index)}
                          disabled={loading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Item Button */}
              <div className="mt-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addItem}
                  className="border-dashed"
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Pricing</h3>
                {selectedItems.filter((item) => item.name).length > 0 &&
                  autoCalculatedPrice !== null &&
                  autoCalculatedPrice > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {useAutoPrice ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Auto-calculated
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            Manual override
                          </Badge>
                        )}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyAutoPrice}
                        disabled={loading || useAutoPrice}
                      >
                        <Calculator className="h-3 w-3 mr-1" />
                        Apply auto-price
                      </Button>
                    </div>
                  )}
              </div>

              {/* Original Price */}
              <FormField
                control={form.control}
                name="originalPrice"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>
                      Original Price *
                      {autoCalculatedPrice !== null &&
                        autoCalculatedPrice > 0 && (
                          <span className="text-xs text-muted-foreground ml-2">
                            (Auto: {formatCurrency(autoCalculatedPrice)})
                          </span>
                        )}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          className="pl-10"
                          placeholder="0.00"
                          value={field.value}
                          onChange={(e) =>
                            handleOriginalPriceChange(e.target.value)
                          }
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    {selectedItems.filter((item) => item.name).length > 0 && (
                      <FormDescription>
                        {useAutoPrice
                          ? "Original price is automatically calculated from selected items"
                          : "Manual price override. Click 'Apply auto-price' to use calculated total."}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Discount Configuration */}
              <div className="mb-6">
                <FormLabel className="text-sm font-medium">Discount</FormLabel>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <FormField
                    control={form.control}
                    name="discountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select discount type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Discount</SelectItem>
                            <SelectItem value="percentage">
                              Percentage (%)
                            </SelectItem>
                            <SelectItem value="amount">
                              Fixed Amount (R)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {discountType === "percentage" && (
                    <FormField
                      control={form.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Percentage</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="pl-10"
                                placeholder="0"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value)
                                  )
                                }
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {discountType === "amount" && (
                    <FormField
                      control={form.control}
                      name="discountValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Amount</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                step="0.01"
                                className="pl-10"
                                placeholder="0.00"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value === ""
                                      ? undefined
                                      : Number(e.target.value)
                                  )
                                }
                                disabled={loading}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>

              {/* Price Summary Card */}
              <div className="border rounded-lg p-4 mb-6 bg-muted/30">
                <h4 className="font-medium mb-3">Price Summary</h4>
                <div className="space-y-2">
                  {/* Subtotal */}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>

                  {/* Item-level discounts */}
                  {totalItemDiscounts > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Item Discounts
                      </span>
                      <span className="text-green-600 font-medium">
                        -{formatCurrency(totalItemDiscounts)}
                      </span>
                    </div>
                  )}

                  {/* Net total after item discounts */}
                  {totalItemDiscounts > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Net Total</span>
                      <span>{formatCurrency(netTotal)}</span>
                    </div>
                  )}

                  {/* Tax breakdown */}
                  {totalTax > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tax ({" "}
                          {Array.from(
                            new Set(
                              selectedItems
                                .filter((item) => item.name && item.taxRate > 0)
                                .map((item) => `${item.taxRate}%`)
                            )
                          ).join(", ")}
                          )
                        </span>
                        <span className="text-red-600 font-medium">
                          +{formatCurrency(totalTax)}
                        </span>
                      </div>
                    </>
                  )}

                  {/* Package-level discount */}
                  {discountType !== "none" && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Package Discount
                        </span>
                        <span className="text-green-600 font-medium">
                          -{getDiscountSummary()}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">You Save</span>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(calculateSavings())}
                        </span>
                      </div>

                      <Separator />
                    </>
                  )}

                  {/* Grand total */}
                  <div className="flex justify-between font-medium text-base pt-2 border-t">
                    <span>Grand Total</span>
                    <span className="text-primary">
                      {formatCurrency(form.getValues("finalPrice") || 0)}
                    </span>
                  </div>

                  {/* Cost breakdown summary */}
                  <div className="text-xs text-muted-foreground mt-2 pt-2 border-t">
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <div>
                          Items:{" "}
                          {selectedItems.filter((item) => item.name).length}
                        </div>
                        <div>
                          Products:{" "}
                          {
                            selectedItems.filter(
                              (item) => item.type === "product" && item.name
                            ).length
                          }
                        </div>
                        <div>
                          Services:{" "}
                          {
                            selectedItems.filter(
                              (item) => item.type === "service" && item.name
                            ).length
                          }
                        </div>
                      </div>
                      <div className="text-right">
                        <div>
                          Auto-calculated:{" "}
                          {formatCurrency(calculateTotalCost())}
                        </div>
                        <div>
                          Final price:{" "}
                          {formatCurrency(form.getValues("finalPrice") || 0)}
                        </div>
                        {calculateTotalCost() > 0 && (
                          <div
                            className={cn(
                              "font-medium",
                              Math.abs(
                                calculateTotalCost() -
                                  (form.getValues("finalPrice") || 0)
                              ) < 0.01
                                ? "text-green-600"
                                : "text-yellow-600"
                            )}
                          >
                            {Math.abs(
                              calculateTotalCost() -
                                (form.getValues("finalPrice") || 0)
                            ) < 0.01
                              ? "✓ Price matches auto-calculation"
                              : "⚠ Price differs from auto-calculation"}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Price (Hidden field) */}
              <FormField
                control={form.control}
                name="finalPrice"
                render={({ field }) => (
                  <FormItem className="hidden">
                    <FormControl>
                      <Input type="hidden" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          className="pl-10"
                          placeholder="e.g., 3 months, 1 year, Lifetime"
                          {...field}
                          value={field.value || ""}
                          disabled={loading}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isDefault"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Default Subpackage
                      </FormLabel>
                      <FormDescription>
                        Set as the default option for this package
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium mb-4">Features</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a feature (e.g., 24/7 Support)"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    onClick={addFeature}
                    variant="outline"
                    disabled={loading}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span>{feature}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(feature)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {features.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No features added yet. Add features to highlight what's
                      included.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Update Subpackage" : "Create Subpackage"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default SubpackageForm;
