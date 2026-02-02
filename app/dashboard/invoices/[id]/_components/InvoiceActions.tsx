"use client";

import { Button } from "@/components/ui/button";
import {
  Send,
  Edit,
  Trash2,
  Truck,
  FileText,
  CreditCard,
  List,
  Download,
  Copy,
  MoreVertical,
  FileDown,
  Plus,
  Loader2,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { DeleteDialog } from "./DeleteDialog";
import { InvoiceProps } from "@/types/invoice";
import { useState, useEffect } from "react";
import { quotationReceiptGenerator } from "@/lib/quotation-receipt-generator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddVendorDialog } from "./AddVendorDialog";
import { useCompanyInfo } from "@/hooks/use-company-info";
import { Editor } from "@/components/ui/editor";

interface InvoiceActionsProps {
  invoice: InvoiceProps;
  isGeneratingPdf: boolean;
  onDownloadPdf: () => void;
  onPrint: () => void;
  hasFullAccess: boolean;
  canDeleteInvoice: boolean;
  canEditInvoice: boolean;
  combineServices: boolean;
}

export function InvoiceActions({
  invoice,
  canEditInvoice,
  canDeleteInvoice,
  hasFullAccess,
  combineServices,
  onPrint,
  onDownloadPdf,
}: InvoiceActionsProps) {
  const router = useRouter();
  const [email, setEmail] = useState(invoice.client.email || "");
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [convertingTo, setConvertingTo] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [vendors, setVendors] = useState<{ label: string; value: string }[]>(
    []
  );
  const [selectedVendorId, setSelectedVendorId] = useState<string>("");
  const { companyInfo } = useCompanyInfo();

  const [customData, setCustomData] = useState({
    referenceNumber: "",
    deliveryAddress: "",
    shippingMethod: "",
    shippingTrackingNumber: "",
    notes: "",
    terms: "",
    deliveryNoteNumber: "",
    supplierId: "",
  });

  useEffect(() => {
    if (convertingTo === "PURCHASE_ORDER" || convertingTo === "SUPPLIER_LIST") {
      fetchVendors();
    }
  }, [convertingTo]);

  useEffect(() => {
    if (convertingTo && companyInfo) {
      const defaultNotesAndTerms = getDefaultNotesAndTerms(convertingTo);
      setCustomData((prev) => ({
        ...prev,
        notes: defaultNotesAndTerms.notes,
        terms: defaultNotesAndTerms.terms,
      }));
    }
  }, [convertingTo, companyInfo]);

  const fetchVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      if (!response.ok) throw new Error("Failed to fetch vendors");
      const data = await response.json();
      setVendors(
        data.map((vendor: any) => ({
          label: vendor.name,
          value: vendor.id,
        }))
      );
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  const getDefaultNotesAndTerms = (documentType: string) => {
    if (!companyInfo) return { notes: "", terms: "" };

    switch (documentType) {
      case "DELIVERY_NOTE":
        return {
          notes: companyInfo.deliveryNoteNote || "",
          terms: companyInfo.deliveryNoteTerms || "",
        };
      case "PURCHASE_ORDER":
        return {
          notes: companyInfo.purchaseOrderNote || "",
          terms: companyInfo.purchaseOrderTerms || "",
        };
      case "PRO_FORMA_INVOICE":
        return {
          notes: companyInfo.proFormaNote || "",
          terms: companyInfo.proFormaTerms || "",
        };
      case "CREDIT_NOTE":
        return {
          notes: companyInfo.creditNoteNote || "",
          terms: companyInfo.creditNoteTerms || "",
        };
      case "SUPPLIER_LIST":
        return {
          notes: companyInfo.supplierListNote || "",
          terms: companyInfo.supplierListTerms || "",
        };
      default:
        return { notes: "", terms: "" };
    }
  };

  const handleSendEmail = async () => {
    if (!email) {
      toast("Please enter a valid email address");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice,
          toEmail: email,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast(` Invoice has been sent to successfully ${invoice.client.email}`);
      setIsDialogOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error sending email:", error);
      toast("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleConvertDocument = async (documentType: string) => {
    try {
      setIsConverting(true);
      const dataToSend = {
        invoiceId: invoice.id,
        invoiceDocumentType: documentType,
        customData: {
          ...customData,
          supplierId: selectedVendorId || customData.supplierId,
        },
      };

      const response = await fetch("/api/invoices/documents/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to create ${documentType}`);
      }

      const newDocument = await response.json();
      toast.success(
        `${getDocumentTypeLabel(documentType)} created successfully`
      );
      setIsConverting(false);

      router.push(`/dashboard/invoice-documents/${newDocument.id}`);
      router.refresh();
    } catch (error) {
      console.error(`Error creating ${documentType}:`, error);
      toast.error(`Failed to create ${documentType}`);
    } finally {
      setConvertingTo(null);
      setCustomData({
        referenceNumber: "",
        deliveryAddress: "",
        shippingMethod: "",
        shippingTrackingNumber: "",
        notes: "",
        terms: "",
        deliveryNoteNumber: "",
        supplierId: "",
      });

      setSelectedVendorId("");
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      DELIVERY_NOTE: "Delivery Note",
      PURCHASE_ORDER: "Purchase Order",
      PRO_FORMA_INVOICE: "Pro Forma Invoice",
      CREDIT_NOTE: "Credit Note",
      SUPPLIER_LIST: "Supplier List",
    };
    return labels[type] || type;
  };

  const handleVendorAdded = () => {
    fetchVendors(); // Refresh vendor list
    toast.success("Vendor added successfully");
  };

  // Handle opening conversion dialog
  const handleOpenConversion = (documentType: string) => {
    setConvertingTo(documentType);
    const defaults = getDefaultNotesAndTerms(documentType);
    setCustomData((prev) => ({
      ...prev,
      notes: defaults.notes,
      terms: defaults.terms,
    }));
  };

  const handlePrintThermal = async () => {
    try {
      if (companyInfo) {
        quotationReceiptGenerator.setCompanyInfo(companyInfo);
      }
      await quotationReceiptGenerator.printReceipt(invoice, "invoice", {
        combineServices,
      });
    } catch (error) {
      console.error("Error printing thermal receipt:", error);
      toast.error("Failed to print thermal receipt");
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Send Invoice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" aria-label="Send invoice">
            <Send className="mr-2 h-4 w-4" /> Send Invoice
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Invoice</DialogTitle>
            <DialogDescription>
              Enter the recipient's email address to send invoice #
              {invoice.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail} disabled={isSending}>
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Button */}
      {invoice.status !== "PAID" && (canEditInvoice || hasFullAccess) && (
        <Button variant="outline" size="sm" asChild aria-label="Edit invoice">
          <Link
            href={`/dashboard/invoices/${invoice.id}/edit`}
            className="flex items-center gap-2"
          >
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
      )}

      {/* Delete Button */}
      {invoice.status === "DRAFT" && (canDeleteInvoice || hasFullAccess) && (
        <DeleteDialog
          invoiceNumber={invoice.invoiceNumber}
          invoiceId={invoice.id}
        />
      )}

      {/* More Actions Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreVertical className="h-4 w-4" />
            <span className="">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {/* Edit Option */}
          {invoice.status !== "PAID" && (canEditInvoice || hasFullAccess) && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/invoices/${invoice.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Invoice
              </Link>
            </DropdownMenuItem>
          )}

          {/* Document Conversion Options */}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Create From Invoice</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => handleOpenConversion("DELIVERY_NOTE")}
          >
            <Truck className="mr-2 h-4 w-4" />
            Delivery Note
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleOpenConversion("PURCHASE_ORDER")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Purchase Order
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleOpenConversion("PRO_FORMA_INVOICE")}
          >
            <FileText className="mr-2 h-4 w-4" />
            Pro Forma Invoice
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              router.push(`/dashboard/invoices/${invoice.id}/credit-note`);
            }}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Credit Note
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleOpenConversion("SUPPLIER_LIST")}
          >
            <List className="mr-2 h-4 w-4" />
            Supplier List
          </DropdownMenuItem>

          {/* Download Options */}
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Download & Print</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={onDownloadPdf} // Fixed: removed arrow function
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF Document
          </DropdownMenuItem>

          {/* Print Option */}
          <DropdownMenuItem onClick={onPrint}>
            {" "}
            {/* Fixed: removed arrow function */}
            <Printer className="mr-2 h-4 w-4" />
            Print PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePrintThermal}>
            <Printer className="mr-2 h-4 w-4" />
            Print Thermal Receipt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Document Conversion Dialogs */}
      {convertingTo && (
        <Dialog
          open={!!convertingTo}
          onOpenChange={() => setConvertingTo(null)}
        >
          <DialogContent className="max-w-md max-h-[95vh] lg:min-w-[800px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Create {getDocumentTypeLabel(convertingTo)}
              </DialogTitle>
              <DialogDescription>
                Customize your {convertingTo.toLowerCase().replace("_", " ")}{" "}
                details. Default notes and terms are pre-filled from settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Vendor selection for purchase orders and supplier lists */}
              {(convertingTo === "PURCHASE_ORDER" ||
                convertingTo === "SUPPLIER_LIST") && (
                <div className="grid gap-2">
                  <Label htmlFor="vendor">Vendor/Supplier *</Label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        value={selectedVendorId}
                        onValueChange={setSelectedVendorId}
                        required={convertingTo === "PURCHASE_ORDER"}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.value} value={vendor.value}>
                              {vendor.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <AddVendorDialog onVendorAdded={handleVendorAdded}>
                      <Button type="button" variant="outline" size="sm">
                        <Plus className="h-3 w-3 mr-1" />
                        New
                      </Button>
                    </AddVendorDialog>
                  </div>
                </div>
              )}

              {/* Notes Field */}
              <div className="grid gap-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <div className="border rounded-md">
                  <Editor
                    value={customData.notes}
                    onChange={(value) =>
                      setCustomData({ ...customData, notes: value })
                    }
                    placeholder="Add any special instructions"
                  />
                </div>
              </div>

              {/* Terms Field */}
              <div className="grid gap-2">
                <Label htmlFor="terms">Terms & Conditions (Optional)</Label>
                <div className="border rounded-md">
                  <Editor
                    value={customData.terms}
                    onChange={(value) =>
                      setCustomData({ ...customData, terms: value })
                    }
                    placeholder="Add terms and conditions"
                  />
                </div>
              </div>

              {/* Information about defaults */}
              {companyInfo && (
                <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                  <p>
                    Default notes and terms are pre-filled from your company
                    settings.
                  </p>
                  <p>You can edit them above or leave them as is.</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setConvertingTo(null);
                  setSelectedVendorId("");
                  setCustomData({
                    referenceNumber: "",
                    deliveryAddress: "",
                    shippingMethod: "",
                    shippingTrackingNumber: "",
                    notes: "",
                    terms: "",
                    deliveryNoteNumber: "",
                    supplierId: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!convertingTo) return;
                  handleConvertDocument(convertingTo);
                }}
                disabled={
                  isConverting ||
                  (convertingTo === "PURCHASE_ORDER" && !selectedVendorId)
                }
                className="flex items-center gap-2"
              >
                {isConverting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isConverting
                  ? "Converting..."
                  : `Create ${getDocumentTypeLabel(convertingTo)}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
