"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format, addDays, addMonths } from "date-fns";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { useEffect, useState, useCallback, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Loader2,
  CalendarIcon,
  X,
  Plus,
  Calculator,
  FileText,
  Repeat,
  Search,
  BadgePercent,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Rich Text Editor
import { Editor } from "@/components/ui/editor";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  InvoiceStatus,
  Client,
  Invoice,
  InvoiceItem,
  GeneralSetting,
  RecurringFrequency,
} from "@prisma/client";
import { Combobox } from "@/components/ui/combobox";
import { InvoiceSchema } from "@/lib/formValidationSchemas";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ClientForm from "@/app/dashboard/human-resources/clients/_components/client-Form";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// --- TYPES ---

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

type ComboboxOption = {
  label: string;
  value: string;
};

interface invoicePrompt {
  invoice: Invoice & {
    client: Client;
    items: InvoiceItem[];
    creator: {
      name: string;
      GeneralSetting: GeneralSetting | null;
    };
  };
}

interface CalculationSummary {
  subtotal: number;
  totalTax: number;
  taxableAmount: number;
  discountAmount: number;
  depositAmount: number;
  interestAmount: number;
  totalAmount: number;
  interestRate: number;
  amountDue: number;
  itemDiscounts: number[];
}

// Extended form schema - UPDATED WITH DETAILS FIELD
const InvoiceFormSchema = InvoiceSchema.extend({
  isRecurring: z.boolean().default(false),
  frequency: z.nativeEnum(RecurringFrequency).optional(),
  interval: z.number().min(1).max(365).default(1).optional(),
  endDate: z.date().optional(),

  // Ensure items allow the new fields - UPDATED WITH DETAILS
  items: z
    .array(
      z.object({
        description: z.string().min(1, "Description is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(0, "Price must be positive"),
        taxRate: z.number().optional(),
        shopProductId: z.string().optional().nullable(),
        serviceId: z.string().optional().nullable(),
        itemDiscountType: z.enum(["AMOUNT", "PERCENTAGE"]).optional(),
        itemDiscountAmount: z.number().optional(),
        details: z.string().optional(),
      }),
    )
    .min(1, "Add at least one item"),

  depositRequired: z.boolean().default(false),
  depositType: z.enum(["AMOUNT", "PERCENTAGE"]).optional(),
  depositAmount: z.number().min(0).optional(),
  payRemainingImmediately: z.boolean().default(false),
});

type InvoiceFormData = z.infer<typeof InvoiceFormSchema>;

// --- HELPERS ---

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount);
};

const safeNumber = (val: any) => (val ? Number(val) : 0);

// --- SUB-COMPONENT (Defined Outside to fix focus issues) ---

interface SearchableItemInputProps {
  index: number;
  searchTerm: string;
  searchableItems: SearchableItem[];
  showDropdown: number | null;
  onSearchChange: (index: number, value: string) => void;
  onFocus: (index: number) => void;
  onBlur: () => void;
  onSelect: (index: number, item: SearchableItem) => void;
  setShowDropdown: (index: number | null) => void;
}

const extractTextFromHTML = (html: string | null | undefined): string => {
  if (!html) return "";

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  return tempDiv.textContent || tempDiv.innerText || "";
};

const SearchableItemInput = ({
  index,
  searchTerm,
  searchableItems,
  showDropdown,
  onSearchChange,
  onFocus,
  onBlur,
  onSelect,
  setShowDropdown,
}: SearchableItemInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const filteredItems = searchableItems.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesName = item.name.toLowerCase().includes(searchLower);
    const matchesSku = item.sku?.toLowerCase().includes(searchLower) || false;
    const matchesCategory =
      item.category?.toLowerCase().includes(searchLower) || false;

    const descriptionText = extractTextFromHTML(item.description);
    const matchesDescription = descriptionText
      .toLowerCase()
      .includes(searchLower);

    return matchesName || matchesSku || matchesDescription || matchesCategory;
  });

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown !== index) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0,
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1,
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

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <input
          ref={inputRef}
          placeholder="Search products/services by name, SKU, description, or category..."
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
          value={searchTerm}
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
                    selectedIndex === itemIndex && "bg-accent",
                  )}
                  onMouseEnter={() => setSelectedIndex(itemIndex)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onSelect(index, item);
                    setSelectedIndex(-1);
                  }}
                >
                  {/* Image thumbnail */}
                  {item.image && (
                    <div className="flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
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
    </div>
  );
};

// --- MAIN COMPONENT ---

// Helper to safely parse numbers
const safeFloat = (value: any): number => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

export default function InvoiceForm({
  type,
  data,
  onCancel,
  onSubmitSuccess,
}: {
  type: "create" | "update" | "creditNote";
  data: invoicePrompt;
  onCancel: () => void;
  onSubmitSuccess: () => void;
}) {
  const [clientsOptions, setClientsOptions] = useState<ComboboxOption[]>([]);
  const [searchableItems, setSearchableItems] = useState<SearchableItem[]>([]);

  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Deposit schedule from general settings
  const [depositScheduleSettings, setDepositScheduleSettings] = useState<{
    depositPaymentEnabled: boolean;
    depositPercentage: number;
    interest30Days: number;
    interest1To3Months: number;
    interest3To6Months: number;
    interest6To9Months: number;
    interest9To12Months: number;
  } | null>(null);
  const [selectedInstallmentPeriod, setSelectedInstallmentPeriod] =
    useState<string>((data?.invoice as any)?.installmentPeriod || "");

  const router = useRouter();

  const [calculations, setCalculations] = useState<CalculationSummary>({
    subtotal: 0,
    totalTax: 0,
    taxableAmount: 0,
    discountAmount: 0,
    depositAmount: 0,
    interestAmount: 0,
    totalAmount: 0,
    interestRate: 0,
    amountDue: 0,
    itemDiscounts: [],
  });

  const [searchInputs, setSearchInputs] = useState<{ [key: number]: string }>(
    {},
  );
  const [showDropdown, setShowDropdown] = useState<number | null>(null);

  const [isRecurring, setIsRecurring] = useState(
    data?.invoice?.isRecurring || false,
  );

  // Deposit Logic for Edit Mode
  let initialDepositAmount = 0;
  if (
    data?.invoice?.depositType === "PERCENTAGE" &&
    data?.invoice?.depositRate
  ) {
    initialDepositAmount = Number(data?.invoice?.depositRate);
  } else if (data?.invoice?.depositAmount) {
    initialDepositAmount = Number(data?.invoice?.depositAmount);
  } else {
    initialDepositAmount = 30;
  }

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(InvoiceFormSchema),
    defaultValues: {
      clientId: data?.invoice?.clientId || "",
      description: data?.invoice?.description || "",
      status: data?.invoice?.status || "DRAFT",
      issueDate: data?.invoice?.issueDate
        ? new Date(data.invoice.issueDate)
        : new Date(),
      dueDate: data?.invoice?.dueDate
        ? new Date(data.invoice.dueDate)
        : new Date(),
      currency: "ZAR",
      items:
        data?.invoice?.items?.length > 0
          ? data.invoice.items.map((item) => ({
              description: item.description,
              quantity: Number(item.quantity),
              unitPrice: Number(item.unitPrice),
              taxRate: item.taxRate ? Number(item.taxRate) : 0,
              shopProductId: (item as any).shopProductId || null,
              serviceId: (item as any).serviceId || null,
              itemDiscountType: (item as any).itemDiscountType || undefined,
              itemDiscountAmount: (item as any).itemDiscountAmount
                ? Number((item as any).itemDiscountAmount)
                : 0,
              details: (item as any).details || "",
            }))
          : [
              {
                description: "",
                quantity: 1,
                unitPrice: 0,
                taxRate: 15,
                shopProductId: null,
                serviceId: null,
                itemDiscountType: undefined,
                itemDiscountAmount: 0,
                details: "",
              },
            ],
      discountType: data?.invoice?.discountType || undefined,
      discountAmount: data?.invoice?.discountAmount
        ? Number(data?.invoice?.discountAmount)
        : undefined,
      depositRequired: (data?.invoice as any)?.depositRequired || false,
      depositType: (data?.invoice as any)?.depositType || "PERCENTAGE",
      depositAmount: initialDepositAmount,
      paymentTerms: data?.invoice?.paymentTerms || "",
      notes: data?.invoice?.notes || "",
      isRecurring: data?.invoice?.isRecurring || false,
      frequency: "MONTHLY",
      interval: 1,
      endDate: undefined,
      installmentPeriod: (data?.invoice as any)?.installmentPeriod || null,
      interestRate: (data?.invoice as any)?.interestRate
        ? Number((data?.invoice as any).interestRate)
        : 0,
      interestAmount: (data?.invoice as any)?.interestAmount
        ? Number((data?.invoice as any).interestAmount)
        : 0,
      payRemainingImmediately:
        (data?.invoice as any)?.payRemainingImmediately || false,
    },
  });

  const { isSubmitting } = form.formState;

  // Initialize search inputs for edit mode
  useEffect(() => {
    const initialSearchInputs: { [key: number]: string } = {};
    form.getValues("items").forEach((item, index) => {
      initialSearchInputs[index] = item.description || "";
    });
    setSearchInputs(initialSearchInputs);
  }, [form]);

  // --- CALCULATION LOGIC ---
  const calculateTotals = useCallback(() => {
    const items = form.getValues("items");
    const discountType = form.getValues("discountType");
    const discountAmountInput = safeNumber(form.getValues("discountAmount"));
    const depositRequired = form.getValues("depositRequired");
    const depositType = form.getValues("depositType");
    const depositAmountInput = safeNumber(form.getValues("depositAmount"));

    // 1. Item Level
    let subtotalGross = 0;
    let totalItemDiscountMoney = 0;

    const itemData = items.map((item) => {
      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unitPrice);
      const taxRate = safeNumber(item.taxRate);
      const itemDiscountInput = safeNumber(item.itemDiscountAmount);

      const baseAmount = quantity * unitPrice;

      let itemDiscountMoney = 0;
      if (item.itemDiscountType === "PERCENTAGE") {
        itemDiscountMoney = baseAmount * (itemDiscountInput / 100);
      } else if (item.itemDiscountType === "AMOUNT") {
        itemDiscountMoney = itemDiscountInput;
      }

      itemDiscountMoney = Math.min(itemDiscountMoney, baseAmount);
      const netAmount = baseAmount - itemDiscountMoney;

      subtotalGross += baseAmount;
      totalItemDiscountMoney += itemDiscountMoney;

      return { baseAmount, itemDiscountMoney, netAmount, taxRate };
    });

    // 2. Global Discount
    const subtotalAfterItemDiscounts = subtotalGross - totalItemDiscountMoney;
    let globalDiscountMoney = 0;

    if (discountType === "PERCENTAGE") {
      globalDiscountMoney =
        subtotalAfterItemDiscounts * (discountAmountInput / 100);
    } else if (discountType === "AMOUNT") {
      globalDiscountMoney = discountAmountInput;
    }
    globalDiscountMoney = Math.min(
      globalDiscountMoney,
      subtotalAfterItemDiscounts,
    );

    // 3. Tax
    let totalTax = 0;
    itemData.forEach((item) => {
      const ratio =
        subtotalAfterItemDiscounts > 0
          ? item.netAmount / subtotalAfterItemDiscounts
          : 0;
      const allocatedGlobalDiscount = globalDiscountMoney * ratio;
      const finalTaxableAmount = item.netAmount - allocatedGlobalDiscount;
      const taxAmount = (finalTaxableAmount * item.taxRate) / 100;
      totalTax += taxAmount;
    });

    // 4. Totals
    const finalSubtotal = subtotalAfterItemDiscounts - globalDiscountMoney; // Taxable Amount
    const totalAmount = finalSubtotal + totalTax;

    // 5. Deposit and Interest Calculation
    let calculatedDeposit = 0;
    if (depositRequired) {
      if (depositType === "PERCENTAGE") {
        calculatedDeposit = totalAmount * (depositAmountInput / 100);
      } else if (depositType === "AMOUNT") {
        calculatedDeposit = depositAmountInput;
      }
      calculatedDeposit = Math.min(calculatedDeposit, totalAmount);
    }

    // Pass 6: Interest Calculation
    // Initialize with current form value to prevent flickering while settings load
    let calculatedInterest = safeFloat(form.getValues("interestAmount"));
    let selectedInterestRate = safeFloat(form.watch("interestRate")) || 0;

    if (
      depositRequired &&
      selectedInstallmentPeriod &&
      depositScheduleSettings?.depositPaymentEnabled
    ) {
      // Scheduled deposit mode: auto-calculate interest on remaining balance
      const remaining = totalAmount - calculatedDeposit;
      calculatedInterest = remaining * (selectedInterestRate / 100);

      // Persist values
      form.setValue("installmentPeriod", selectedInstallmentPeriod);
      form.setValue("interestAmount", calculatedInterest);
    } else if (depositScheduleSettings !== undefined) {
      // Manual mode or schedule disabled: clear installment period
      form.setValue("installmentPeriod", null);

      if (depositRequired && selectedInterestRate > 0) {
        // Manual interest: apply rate to remaining balance after deposit
        const remaining = totalAmount - calculatedDeposit;
        calculatedInterest = remaining * (selectedInterestRate / 100);
        form.setValue("interestAmount", calculatedInterest);
      } else {
        // No deposit or no interest rate — clear interest
        calculatedInterest = 0;
        if (!selectedInterestRate) {
          form.setValue("interestRate", 0);
        }
        form.setValue("interestAmount", 0);
      }
    }

    const finalTotalAmount = totalAmount + calculatedInterest;
    const amountDue = finalTotalAmount - calculatedDeposit;

    setCalculations({
      subtotal: subtotalGross,
      totalTax,
      taxableAmount: finalSubtotal,
      discountAmount: globalDiscountMoney + totalItemDiscountMoney,
      depositAmount: calculatedDeposit,
      interestAmount: calculatedInterest,
      interestRate: selectedInterestRate,
      totalAmount: finalTotalAmount,
      amountDue,
      itemDiscounts: itemData.map((i) => i.itemDiscountMoney),
    });
  }, [form, selectedInstallmentPeriod, depositScheduleSettings]);

  const updateDueDateByPeriod = (period: string) => {
    const issueDate = form.getValues("issueDate") || new Date();
    let newDate = new Date(issueDate);

    switch (period) {
      case "30days":
        newDate = addDays(issueDate, 30);
        break;
      case "1to3months":
        newDate = addMonths(issueDate, 3);
        break;
      case "3to6months":
        newDate = addMonths(issueDate, 6);
        break;
      case "6to9months":
        newDate = addMonths(issueDate, 9);
        break;
      case "9to12months":
        newDate = addMonths(issueDate, 12);
        break;
    }

    form.setValue("dueDate", newDate);
  };

  const handleDepositChange = (
    required: boolean,
    type: "AMOUNT" | "PERCENTAGE",
    amount: number,
  ) => {
    form.setValue("depositRequired", required);
    form.setValue("depositType", type);
    if (amount !== undefined) {
      form.setValue("depositAmount", amount);
    }
    calculateTotals();
  };

  const handleDiscountChange = (
    type: "AMOUNT" | "PERCENTAGE",
    amount: number,
  ) => {
    form.setValue("discountType", type);
    form.setValue("discountAmount", amount);
    calculateTotals();
  };

  useEffect(() => {
    calculateTotals();
  }, [
    form.watch("items"),
    form.watch("discountType"),
    form.watch("discountAmount"),
    form.watch("depositRequired"),
    form.watch("depositType"),
    form.watch("depositAmount"),
    form.watch("interestRate"),
    selectedInstallmentPeriod,
  ]);

  // --- DATA FETCHING ---

  const fetchClients = async () => {
    setIsLoadingClients(true);
    try {
      const response = await axios.get("/api/clients");
      const clients: Client[] = response?.data || [];
      const options = clients
        .filter((client) => client.id && client.name)
        .map((client) => ({ label: client.name || "", value: client.id }));
      setClientsOptions(options);
    } catch (err) {
      toast.error("Failed to load clients");
    } finally {
      setIsLoadingClients(false);
    }
  };

  const fetchItems = async () => {
    setIsLoadingItems(true);
    try {
      const [productsResponse, servicesResponse] = await Promise.all([
        axios.get("/api/shop/products/pos"),
        axios.get("/api/services"),
      ]);

      const combinedItems: SearchableItem[] = [
        ...(productsResponse?.data || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          type: "product" as const,
          price: Number(product.price || 0),
          category: product.category,
          sku: product.sku || undefined,
          description: product.description || undefined,
          image:
            product.images && product.images.length > 0
              ? product.images[0]
              : undefined,
        })),
        ...(servicesResponse?.data || []).map((service: any) => ({
          id: service.id,
          name: service.name,
          type: "service" as const,
          price: Number(service.amount || 0),
          category: service.category,
          duration: service.duration || undefined,
          features: service.features || [],
          description: service.description || undefined,
          image: service.image || undefined,
        })),
      ];
      setSearchableItems(combinedItems);
    } catch (err) {
      toast.error("Failed to load items");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings/general");
      const { data } = await response.json();
      if (type === "create" && data) {
        form.setValue("paymentTerms", data.paymentTerms || "");
        form.setValue("notes", data.note || "");
        if (data.depositPaymentEnabled) {
          form.setValue("depositType", "PERCENTAGE");
          form.setValue("depositAmount", data.depositPercentage ?? 60);
        }
      }
      if (data) {
        setDepositScheduleSettings({
          depositPaymentEnabled: data.depositPaymentEnabled ?? false,
          depositPercentage: data.depositPercentage ?? 60,
          interest30Days: data.interest30Days ?? 18,
          interest1To3Months: data.interest1To3Months ?? 40,
          interest3To6Months: data.interest3To6Months ?? 45,
          interest6To9Months: data.interest6To9Months ?? 60,
          interest9To12Months: data.interest9To12Months ?? 70,
        });
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchClients();
    fetchItems();
  }, []);

  // --- HANDLERS ---

  const handleSearchInputChange = (index: number, value: string) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));
    form.setValue(`items.${index}.description`, value);

    if (value === "") {
      form.setValue(`items.${index}.shopProductId`, null);
      form.setValue(`items.${index}.serviceId`, null);
      form.setValue(`items.${index}.itemDiscountType`, undefined);
      form.setValue(`items.${index}.itemDiscountAmount`, 0);
    }

    if (value.length > 0) {
      setShowDropdown(index);
    } else {
      setShowDropdown(null);
    }
  };
  const handleItemSelect = (index: number, item: SearchableItem) => {
    const description = item.name;

    setSearchInputs((prev) => ({ ...prev, [index]: description }));
    form.setValue(`items.${index}.description`, description);
    form.setValue(`items.${index}.unitPrice`, item.price);
    form.setValue(`items.${index}.taxRate`, 15);
    form.setValue(`items.${index}.itemDiscountType`, undefined);
    form.setValue(`items.${index}.itemDiscountAmount`, 0);

    if (item.type === "product") {
      form.setValue(`items.${index}.shopProductId`, item.id);
      form.setValue(`items.${index}.serviceId`, null);
    } else {
      form.setValue(`items.${index}.serviceId`, item.id);
      form.setValue(`items.${index}.shopProductId`, null);
    }

    setShowDropdown(null);
    setTimeout(calculateTotals, 0);
  };

  const handleQuantityChange = (index: number, value: number) => {
    form.setValue(`items.${index}.quantity`, value);
    calculateTotals();
  };

  const handleUnitPriceChange = (index: number, value: number) => {
    form.setValue(`items.${index}.unitPrice`, value);
    calculateTotals();
  };

  const handleTaxRateChange = (index: number, value: number) => {
    form.setValue(`items.${index}.taxRate`, value);
    calculateTotals();
  };

  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 15,
        shopProductId: null,
        serviceId: null,
        itemDiscountType: undefined,
        itemDiscountAmount: 0,
        details: "",
      },
    ]);
    setTimeout(calculateTotals, 0);
  };

  const removeItem = (index: number) => {
    const items = form.getValues("items");
    if (items.length > 1) {
      form.setValue(
        "items",
        items.filter((_, i) => i !== index),
      );

      // Remove search input key and re-index the remaining items
      setSearchInputs((prev) => {
        const newInputs: { [key: number]: string } = {};
        let newIndex = 0;

        // Re-map all inputs to maintain correct indexing
        Object.keys(prev).forEach((key) => {
          const oldIndex = parseInt(key);
          if (oldIndex !== index) {
            newInputs[newIndex] = prev[oldIndex];
            newIndex++;
          }
        });

        return newInputs;
      });

      // Re-index the showDropdown if needed
      if (showDropdown !== null) {
        if (showDropdown === index) {
          setShowDropdown(null);
        } else if (showDropdown > index) {
          setShowDropdown(showDropdown - 1);
        }
      }

      setTimeout(calculateTotals, 0);
    }
  };

  const getNextInvoiceDate = (
    startDate: Date,
    frequency: RecurringFrequency,
    interval: number,
  ): Date => {
    const date = new Date(startDate);
    switch (frequency) {
      case "DAILY":
        date.setDate(date.getDate() + interval);
        break;
      case "WEEKLY":
        date.setDate(date.getDate() + interval * 7);
        break;
      case "MONTHLY":
        date.setMonth(date.getMonth() + interval);
        break;
      case "QUARTERLY":
        date.setMonth(date.getMonth() + interval * 3);
        break;
      case "YEARLY":
        date.setFullYear(date.getFullYear() + interval);
        break;
    }
    return date;
  };

  const getFrequencyLabel = (
    frequency: RecurringFrequency,
    interval: number,
  ): string => {
    const intervalText = interval > 1 ? `${interval} ` : "";
    switch (frequency) {
      case "DAILY":
        return `${intervalText}day${interval > 1 ? "s" : ""}`;
      case "WEEKLY":
        return `${intervalText}week${interval > 1 ? "s" : ""}`;
      case "MONTHLY":
        return `${intervalText}month${interval > 1 ? "s" : ""}`;
      case "QUARTERLY":
        return `${intervalText}quarter${interval > 1 ? "s" : ""}`;
      case "YEARLY":
        return `${intervalText}year${interval > 1 ? "s" : ""}`;
      default:
        return "";
    }
  };

  const getRowNetTotal = (index: number) => {
    const item = form.getValues(`items.${index}`);
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
    const net = Math.max(0, base - disc);
    const tax = net * (taxRate / 100);
    return net + tax;
  };

  const onSubmit = async (values: InvoiceFormData) => {
    try {
      const itemsWithProductIds = values.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        shopProductId: item.shopProductId || undefined,
        serviceId: item.serviceId || undefined,
        itemDiscountType: item.itemDiscountType || undefined,
        itemDiscountAmount: item.itemDiscountAmount || 0,
        details: item.details || undefined,
      }));

      const invoiceData = {
        ...values,
        items: itemsWithProductIds,
        issueDate: values.issueDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        discountType: values.discountType || undefined,
      };

      let response;

      if (values.isRecurring) {
        const recurringData = {
          clientId: values.clientId,
          description: values.description,
          frequency: values.frequency!,
          interval: values.interval!,
          startDate: values.issueDate.toISOString(),
          endDate: values.endDate ? values.endDate.toISOString() : null,
          items: itemsWithProductIds,
          currency: values.currency,
          discountType: values.discountType,
          discountAmount: values.discountAmount,
          depositRequired: values.depositRequired,
          depositType: values.depositType,
          depositAmount: values.depositAmount,
          paymentTerms: values.paymentTerms,
          installmentPeriod: values.installmentPeriod,
          interestRate: values.interestRate,
          interestAmount: values.interestAmount,
          notes: values.notes,
        };
        response = await axios.post("/api/invoices/recurring", recurringData);
        toast.success("Recurring invoice created successfully");

        if (response?.data?.id) {
          const newInvoiceId = response.data.id;
          router.push(`/dashboard/invoices/${newInvoiceId}`);
        }
        return;
      } else {
        if (type === "create") {
          response = await axios.post("/api/invoices", invoiceData);
          toast.success("Invoice created successfully");

          if (response?.data?.id) {
            const newInvoiceId = response.data.id;
            router.push(`/dashboard/invoices/${newInvoiceId}`);
          }
          return;
        } else if (type === "update") {
          response = await axios.put(
            `/api/invoices/${data.invoice.id}`,
            invoiceData,
          );
          toast.success("Invoice updated successfully");

          if (values.isRecurring && !(data.invoice as any).invoiceNumber) {
            router.push(`/dashboard/invoices/recurring/${data.invoice.id}`);
          } else {
            router.push(`/dashboard/invoices/${data.invoice.id}`);
          }

          router.refresh();
          onSubmitSuccess();
          return;
        } else {
          // For credit note
          response = await axios.post(
            `/api/invoices/${data.invoice.id}/credit-note`,
            invoiceData,
          );

          if (response?.data?.creditNote?.id) {
            router.push(
              `/dashboard/invoice-documents/${response.data.creditNote.id}`,
            );
            toast.success("Credit Note Created successfully");
          }
          return;
        }
      }
    } catch (error: any) {
      console.error("Invoice error:", error);
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  // --- JSX ---

  const watchedFrequency = form.watch("frequency");
  const watchedInterval = form.watch("interval");
  const watchedIssueDate = form.watch("issueDate");
  const watchedEndDate = form.watch("endDate");
  const nextInvoiceDate =
    isRecurring && watchedFrequency && watchedIssueDate
      ? getNextInvoiceDate(
          watchedIssueDate,
          watchedFrequency,
          watchedInterval || 1,
        )
      : null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground">
                  {type === "create"
                    ? "Create a new invoice"
                    : type === "creditNote"
                      ? "Create Credit Note"
                      : "Update invoice"}
                </p>
              </div>
            </div>
            {/* Recurring Toggle */}
            <div className="flex items-center space-x-3">
              {data?.invoice?.isRecurring ? null : (
                <div className="flex items-center space-x-2">
                  <Repeat className="h-4 w-4 text-muted-foreground" />
                  <FormField
                    control={form.control}
                    name="isRecurring"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) => {
                              field.onChange(checked);
                              setIsRecurring(checked);
                            }}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer">
                          Recurring
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {isRecurring && (
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  <Repeat className="h-3 w-3 mr-1" /> Recurring
                </Badge>
              )}
            </div>
          </div>

          {/* Client + Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <div className="flex gap-2">
                    <FormControl className="flex-1">
                      <Combobox
                        options={clientsOptions}
                        value={field.value}
                        onChange={field.onChange}
                        isLoading={isLoadingClients}
                        placeholder="Select a client"
                      />
                    </FormControl>
                    <Dialog
                      open={isAddDialogOpen}
                      onOpenChange={setIsAddDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="shrink-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Client</DialogTitle>
                          <DialogDescription>
                            Create new client profile.
                          </DialogDescription>
                        </DialogHeader>
                        <ClientForm
                          type="create"
                          onCancel={() => setIsAddDialogOpen(false)}
                          onSubmitSuccess={() => {
                            setIsAddDialogOpen(false);
                            fetchClients();
                            toast.success("Client added");
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Project or invoice description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Issue Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground",
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < form.getValues("issueDate")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(InvoiceStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Currency</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Recurring Block */}
          {isRecurring && (
            <div className="mt-6 p-4 border rounded-lg bg-blue-50/50 dark:bg-zinc-900">
              <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                <Repeat className="h-4 w-4" /> Recurring Settings
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="DAILY">Daily</SelectItem>
                          <SelectItem value="WEEKLY">Weekly</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="YEARLY">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interval"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value) || 1)
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date (Optional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>No end date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < form.getValues("issueDate")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              </div>
              {watchedFrequency && (
                <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded border text-sm flex justify-between">
                  <span>
                    Every{" "}
                    {getFrequencyLabel(watchedFrequency, watchedInterval || 1)}
                  </span>
                  {nextInvoiceDate && (
                    <span className="text-green-600">
                      Next: {format(nextInvoiceDate, "PPP")}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ITEMS SECTION - UPDATED WITH DETAILS TEXTAREA */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Invoice Items</h3>
          </div>

          <div className="grid grid-cols-12 gap-3 mb-3 px-4 py-2 bg-muted/50 rounded-lg text-sm font-medium">
            <div className="col-span-4">Description</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-1 text-center">Discount</div>
            <div className="col-span-1 text-center">Tax %</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-3">
            {form.watch("items").map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-start p-4 border rounded-lg bg-background hover:bg-muted/30 transition-colors"
              >
                {/* Description Search with Details Textarea */}
                <div className="col-span-4 space-y-2">
                  <SearchableItemInput
                    index={index}
                    searchTerm={searchInputs[index] || ""}
                    searchableItems={searchableItems}
                    showDropdown={showDropdown}
                    onSearchChange={handleSearchInputChange}
                    onFocus={(idx) => setShowDropdown(idx)}
                    onBlur={() => setTimeout(() => setShowDropdown(null), 200)}
                    onSelect={handleItemSelect}
                    setShowDropdown={setShowDropdown}
                  />

                  {/* Added textarea for item details */}
                  <FormControl>
                    <textarea
                      placeholder="Additional item details or specifications..."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[60px] resize-y"
                      value={item.details || ""}
                      onChange={(e) => {
                        form.setValue(`items.${index}.details`, e.target.value);
                      }}
                    />
                  </FormControl>
                </div>

                {/* Quantity */}
                <div className="col-span-1">
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      className="text-center"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 1;
                        handleQuantityChange(index, val);
                      }}
                    />
                  </FormControl>
                </div>

                {/* Price */}
                <div className="col-span-2">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      className="text-left"
                      value={item.unitPrice ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        handleUnitPriceChange(
                          index,
                          value === "" ? 0 : Number(value),
                        );
                      }}
                    />
                  </FormControl>
                </div>

                {/* Discount */}
                <div className="col-span-1 space-y-1">
                  <Select
                    value={item.itemDiscountType || ""}
                    onValueChange={(val: "AMOUNT" | "PERCENTAGE") => {
                      form.setValue(`items.${index}.itemDiscountType`, val);
                      calculateTotals();
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
                    <Input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      className="h-8 text-center text-xs"
                      value={item.itemDiscountAmount || ""}
                      onChange={(e) => {
                        form.setValue(
                          `items.${index}.itemDiscountAmount`,
                          parseFloat(e.target.value) || 0,
                        );
                        calculateTotals();
                      }}
                    />
                  )}
                </div>

                {/* Tax Rate */}
                <div className="col-span-1">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      className="text-center"
                      value={item.taxRate}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        handleTaxRateChange(index, val);
                      }}
                    />
                  </FormControl>
                </div>

                {/* Row Total */}
                <div className="col-span-2 text-right">
                  <div className="text-sm font-medium">
                    {formatCurrency(getRowNetTotal(index))}
                  </div>
                  {calculations.itemDiscounts[index] > 0 && (
                    <div className="text-xs text-red-600">
                      -{formatCurrency(calculations.itemDiscounts[index])}
                    </div>
                  )}
                </div>

                {/* Remove */}
                <div className="col-span-1 flex justify-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={form.watch("items").length <= 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="border-dashed"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Item
            </Button>
          </div>
        </div>

        {/* Global Financials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Global Discount Section */}
          <div className="bg-card border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Global Discount</h4>
            <div className="space-y-4">
              <FormItem>
                <FormLabel>Discount Type</FormLabel>
                <Select
                  value={form.watch("discountType") || ""}
                  onValueChange={(value: "AMOUNT" | "PERCENTAGE") => {
                    handleDiscountChange(
                      value,
                      form.getValues("discountAmount") || 0,
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select discount type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>

              {form.watch("discountType") && (
                <FormItem>
                  <FormLabel>
                    Discount Amount{" "}
                    {form.watch("discountType") === "PERCENTAGE" ? "(%)" : ""}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      step={
                        form.watch("discountType") === "PERCENTAGE"
                          ? "0.1"
                          : "1.00"
                      }
                      placeholder={
                        form.watch("discountType") === "PERCENTAGE"
                          ? "0.00%"
                          : "0.00"
                      }
                      value={form.watch("discountAmount") || ""}
                      onChange={(e) => {
                        const input = e.target.value;
                        if (input === "") {
                          handleDiscountChange(
                            form.getValues("discountType")!,
                            0,
                          );
                          return;
                        }
                        let value = parseFloat(input);
                        if (isNaN(value)) {
                          handleDiscountChange(
                            form.getValues("discountType")!,
                            0,
                          );
                          return;
                        }
                        if (
                          form.watch("discountType") === "PERCENTAGE" &&
                          value > 100
                        ) {
                          value = 100;
                        }
                        handleDiscountChange(
                          form.getValues("discountType")!,
                          value,
                        );
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            </div>
          </div>

          {/* Deposit Section */}
          <div className="bg-card border rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <BadgePercent className="h-4 w-4" />
              Deposit
            </h4>
            <div className="space-y-4">
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Require Deposit</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Request a deposit payment from the client
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={form.watch("depositRequired")}
                    onCheckedChange={(checked) => {
                      handleDepositChange(
                        checked,
                        form.getValues("depositType") || "PERCENTAGE",
                        form.getValues("depositAmount") || 50,
                      );
                      if (!checked) setSelectedInstallmentPeriod("");
                    }}
                  />
                </FormControl>
              </FormItem>

              {form.watch("depositRequired") && (
                <>
                  {/* If deposit schedule is enabled show installment selector, otherwise manual */}
                  {depositScheduleSettings?.depositPaymentEnabled ? (
                    <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <BadgePercent className="h-4 w-4 text-primary" />
                        Deposit Payment Schedule
                      </div>

                      {/* Deposit % and Pay Immediately Switch */}
                      <div className="space-y-3">
                        <FormItem>
                          <FormLabel className="text-xs">Deposit (%)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={form.watch("depositAmount") || ""}
                              onChange={(e) => {
                                handleDepositChange(
                                  true,
                                  "PERCENTAGE",
                                  parseFloat(e.target.value) || 0,
                                );
                              }}
                            />
                          </FormControl>
                        </FormItem>

                        <FormItem className="flex flex-row items-center justify-between rounded-md border p-2 bg-background/50">
                          <div className="space-y-0.5">
                            <FormLabel className="text-xs font-medium">
                              Immediately after work done
                            </FormLabel>
                            <div className="text-[10px] text-muted-foreground leading-tight">
                              Remaining balance due upon completion
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={form.watch("payRemainingImmediately")}
                              onCheckedChange={(checked) => {
                                form.setValue(
                                  "payRemainingImmediately",
                                  checked,
                                );
                                if (checked) {
                                  setSelectedInstallmentPeriod("");
                                  form.setValue("interestRate", 0);
                                }
                                calculateTotals();
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      </div>

                      {/* Payment Plan & Interest Section (Hidden if Pay Immediately is ON) */}
                      {!form.watch("payRemainingImmediately") && (
                        <div className="space-y-4 pt-2 border-t border-dashed">
                          {/* Installment period selector */}
                          <div className="space-y-2">
                            <FormLabel className="text-xs">
                              Balance Repayment Term
                            </FormLabel>
                            <Select
                              value={selectedInstallmentPeriod}
                              onValueChange={(val) => {
                                setSelectedInstallmentPeriod(val);
                                // Sync deposit % and interest % into form from settings when period is selected
                                const interestRateMap: Record<string, number> =
                                  {
                                    "30days":
                                      depositScheduleSettings.interest30Days,
                                    "1to3months":
                                      depositScheduleSettings.interest1To3Months,
                                    "3to6months":
                                      depositScheduleSettings.interest3To6Months,
                                    "6to9months":
                                      depositScheduleSettings.interest6To9Months,
                                    "9to12months":
                                      depositScheduleSettings.interest9To12Months,
                                  };
                                form.setValue("depositType", "PERCENTAGE");
                                form.setValue(
                                  "depositAmount",
                                  depositScheduleSettings!.depositPercentage,
                                );
                                form.setValue(
                                  "interestRate",
                                  interestRateMap[val] || 0,
                                );
                                updateDueDateByPeriod(val);
                                calculateTotals();
                              }}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select payment period..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="30days">
                                  30 Days —{" "}
                                  {depositScheduleSettings.interest30Days}%
                                  interest
                                </SelectItem>
                                <SelectItem value="1to3months">
                                  1–3 Months —{" "}
                                  {depositScheduleSettings.interest1To3Months}%
                                  interest
                                </SelectItem>
                                <SelectItem value="3to6months">
                                  3–6 Months —{" "}
                                  {depositScheduleSettings.interest3To6Months}%
                                  interest
                                </SelectItem>
                                <SelectItem value="6to9months">
                                  6–9 Months —{" "}
                                  {depositScheduleSettings.interest6To9Months}%
                                  interest
                                </SelectItem>
                                <SelectItem value="9to12months">
                                  9–12 Months —{" "}
                                  {depositScheduleSettings.interest9To12Months}%
                                  interest
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Interest Rate - Moved under payment period */}
                          <FormItem>
                            <FormLabel className="text-xs">
                              Interest Rate (%)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                className="h-8"
                                value={form.watch("interestRate") || ""}
                                onChange={(e) => {
                                  form.setValue(
                                    "interestRate",
                                    parseFloat(e.target.value) || 0,
                                  );
                                  calculateTotals();
                                }}
                              />
                            </FormControl>
                          </FormItem>
                        </div>
                      )}

                      {/* Installment breakdown */}
                      {selectedInstallmentPeriod &&
                        (() => {
                          const totalWithoutInterest =
                            calculations.totalAmount -
                            calculations.interestAmount;
                          const depositAmt = calculations.depositAmount;
                          const remaining = totalWithoutInterest - depositAmt;
                          const interestAmt = calculations.interestAmount;
                          const totalRemaining = remaining + interestAmt;

                          return (
                            <div className="rounded-md bg-background border p-4 space-y-2 text-sm">
                              <p className="font-medium text-base mb-3">
                                Payment Breakdown
                              </p>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Total Invoice Amount:
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(totalWithoutInterest)}
                                </span>
                              </div>
                              <div className="flex justify-between text-green-700">
                                <span>
                                  Deposit ({form.watch("depositAmount")}%):
                                </span>
                                <span className="font-semibold">
                                  {formatCurrency(depositAmt)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Remaining Balance:
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(remaining)}
                                </span>
                              </div>
                              <div className="flex justify-between text-orange-600">
                                <span>
                                  Interest ({calculations.interestRate}%):
                                </span>
                                <span className="font-semibold">
                                  + {formatCurrency(interestAmt)}
                                </span>
                              </div>
                              <div className="flex justify-between border-t pt-2 font-semibold text-base">
                                <span>Total Remaining Payable:</span>
                                <span className="text-primary">
                                  {formatCurrency(totalRemaining)}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  ) : (
                    /* Manual deposit entry */
                    <>
                      <FormItem>
                        <FormLabel>Deposit Type</FormLabel>
                        <Select
                          value={form.watch("depositType") || ""}
                          onValueChange={(value: "AMOUNT" | "PERCENTAGE") => {
                            handleDepositChange(
                              true,
                              value,
                              form.getValues("depositAmount") || 50,
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select deposit type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AMOUNT">Fixed Amount</SelectItem>
                            <SelectItem value="PERCENTAGE">
                              Percentage
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>

                      <FormItem>
                        <FormLabel className="text-xs">
                          Deposit Amount{" "}
                          {form.watch("depositType") === "PERCENTAGE"
                            ? "(%)"
                            : ""}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            step={
                              form.watch("depositType") === "PERCENTAGE"
                                ? "1"
                                : "0.01"
                            }
                            className="h-9 text-sm"
                            placeholder={
                              form.watch("depositType") === "PERCENTAGE"
                                ? "50"
                                : "0.00"
                            }
                            value={form.watch("depositAmount") || ""}
                            onChange={(e) => {
                              const input = e.target.value;
                              if (input === "") {
                                handleDepositChange(
                                  true,
                                  form.getValues("depositType") || "PERCENTAGE",
                                  0,
                                );
                                return;
                              }
                              let value = parseFloat(input);
                              if (isNaN(value)) {
                                handleDepositChange(
                                  true,
                                  form.getValues("depositType") || "PERCENTAGE",
                                  0,
                                );
                                return;
                              }
                              if (
                                form.watch("depositType") === "PERCENTAGE" &&
                                value > 100
                              ) {
                                value = 100;
                              }
                              handleDepositChange(
                                true,
                                form.getValues("depositType") || "PERCENTAGE",
                                value,
                              );
                            }}
                          />
                        </FormControl>
                      </FormItem>

                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-2 bg-background/50">
                        <div className="space-y-0.5">
                          <FormLabel className="text-xs font-medium">
                            Immediately after work done
                          </FormLabel>
                          <div className="text-[10px] text-muted-foreground leading-tight">
                            Remaining balance due upon completion
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={form.watch("payRemainingImmediately")}
                            onCheckedChange={(checked) => {
                              form.setValue("payRemainingImmediately", checked);
                              if (checked) {
                                form.setValue("interestRate", 0);
                              }
                              calculateTotals();
                            }}
                          />
                        </FormControl>
                      </FormItem>

                      {!form.watch("payRemainingImmediately") && (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Interest Rate (%)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0"
                              className="h-8"
                              value={form.watch("interestRate") || ""}
                              onChange={(e) => {
                                form.setValue(
                                  "interestRate",
                                  parseFloat(e.target.value) || 0,
                                );
                                calculateTotals();
                              }}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Calculation Summary */}
          <div className="bg-card border rounded-lg p-6">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Calculation Summary
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal (Gross):</span>
                <span className="font-medium">
                  {formatCurrency(calculations.subtotal)}
                </span>
              </div>

              {calculations.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Total Discount:</span>
                  <span className="font-medium">
                    - {formatCurrency(calculations.discountAmount)}
                  </span>
                </div>
              )}

              {/* Added Taxable Amount Display */}
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Taxable Amount:</span>
                <span className="font-medium">
                  {formatCurrency(calculations.taxableAmount)}
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Tax:</span>
                <span className="font-medium">
                  {formatCurrency(calculations.totalTax)}
                </span>
              </div>

              {calculations.interestAmount > 0 && (
                <div className="flex justify-between text-sm text-orange-600">
                  <span>Interest ({calculations.interestRate}%):</span>
                  <span className="font-medium">
                    + {formatCurrency(calculations.interestAmount)}
                  </span>
                </div>
              )}

              <div className="flex justify-between border-t pt-3 text-base font-semibold">
                <span>Total Amount:</span>
                <span className="text-primary">
                  {formatCurrency(calculations.totalAmount)}
                </span>
              </div>

              {form.watch("depositRequired") &&
                calculations.depositAmount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600 border-t pt-3">
                      <span>Deposit:</span>
                      <span className="font-medium">
                        {formatCurrency(calculations.depositAmount)}
                        {form.watch("depositType") === "PERCENTAGE" &&
                          ` (${form.getValues("depositAmount")}%)`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-semibold border-t pt-3">
                      <span>Amount Due:</span>
                      <span className="text-blue-600">
                        {formatCurrency(calculations.amountDue)}
                      </span>
                    </div>
                  </>
                )}
            </div>
          </div>
        </div>

        {/* Rich Text Editors */}
        <div className="bg-card border rounded-lg p-6">
          <h4 className="font-semibold mb-4">Additional Information</h4>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <FormItem>
                <FormLabel>Payment Terms</FormLabel>
                <FormControl>
                  <Editor
                    placeholder="Terms..."
                    value={form.watch("paymentTerms") || ""}
                    onChange={(val) => form.setValue("paymentTerms", val)}
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Editor
                    placeholder="Notes..."
                    value={form.watch("notes") || ""}
                    onChange={(val) => form.setValue("notes", val)}
                  />
                </FormControl>
              </FormItem>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="min-w-24"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-32">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `${type === "create" ? "Create" : type === "update" ? "Update Invoice" : "Create Credit Note"}`
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
