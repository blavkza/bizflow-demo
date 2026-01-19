// lib/invoice-document-report-generator.ts
import {
  InvoiceDocumentWithRelations,
  DocumentItem,
  GeneralSettingType,
} from "@/types/invoice-document";

// Update the CompanyInfo interface to match GeneralSetting
interface CompanyInfo {
  companyName?: string;
  Address?: string;
  city?: string;
  province?: string;
  postCode?: string;
  phone?: string;
  phone1?: string;
  phone2?: string;
  phone3?: string;
  website?: string;
  bankAccount?: string;
  bankAccount2?: string;
  bankName?: string;
  bankName2?: string;
  email?: string;
  taxId?: string;
  logo?: string;
  paymentTerms?: string;
  note?: string;
}

// Type for combined service calculations
interface CombinedServiceData {
  description: string;
  quantity: number;
  unitPrice: number;
  linePrice: number;
  discountInput: string;
  vat: number;
  total: number;
  individualServices: Array<{
    description: string;
    qty: number;
    unitPrice: number;
    linePrice: number;
    discountInput: string;
    vat: number;
    total: number;
  }>;
  displayType: "combined-service";
}

export class InvoiceDocumentReportGenerator {
  private static decimalToNumber(decimalValue: any): number {
    if (decimalValue === null || decimalValue === undefined) return 0;
    if (typeof decimalValue === "number") return decimalValue;
    if (typeof decimalValue === "string") return parseFloat(decimalValue) || 0;
    if (typeof decimalValue === "object")
      return parseFloat(decimalValue.toString()) || 0;
    return 0;
  }

  private static formatMoney(amount: number): string {
    return amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private static getDocumentConfig(documentType: string) {
    const configs: Record<string, any> = {
      DELIVERY_NOTE: {
        title: "DELIVERY NOTE",
        color: "#1e40af",
        icon: "",
        showPrice: false,
        showTotals: false,
        showVAT: false,
        showDeliveryInfo: true,
        showOnlyProducts: true,
        showUnit: false,
        showTotalWeight: true,
        showSKU: true,
        showNotes: true,
        showPaymentTerms: true,
        showSupplierDetails: false,
      },
      PURCHASE_ORDER: {
        title: "PURCHASE ORDER",
        color: "#ea580c",
        icon: "",
        showPrice: true,
        showTotals: true,
        showVAT: true,
        showDeliveryInfo: false,
        showOnlyProducts: true, // Purchase orders typically show only products
        showUnit: false,
        showTotalWeight: false,
        showSKU: true,
        showNotes: true,
        showPaymentTerms: true,
        showSupplierDetails: true,
      },
      PRO_FORMA_INVOICE: {
        title: "PRO FORMA INVOICE",
        color: "#7c3aed",
        icon: "",
        showPrice: true,
        showTotals: true,
        showVAT: true,
        showDeliveryInfo: false,
        showOnlyProducts: false, // Pro forma can show both products and services
        showUnit: false,
        showTotalWeight: false,
        showSKU: true,
        showNotes: true,
        showPaymentTerms: true,
        showSupplierDetails: false,
      },
      CREDIT_NOTE: {
        title: "CREDIT NOTE",
        color: "#dc2626",
        icon: "",
        showPrice: true,
        showTotals: true,
        showVAT: true,
        showDeliveryInfo: false,
        showOnlyProducts: false, // Credit notes can show both products and services
        showUnit: false,
        showTotalWeight: false,
        showSKU: true,
        showNotes: true,
        showPaymentTerms: true,
        showSupplierDetails: false,
      },
      SUPPLIER_LIST: {
        title: "SUPPLIER LIST",
        color: "#475569",
        icon: "",
        showPrice: false,
        showTotals: false,
        showVAT: false,
        showDeliveryInfo: false,
        showOnlyProducts: true, // Supplier lists typically show only products
        showUnit: false,
        showTotalWeight: true,
        showSKU: false,
        showNotes: false,
        showPaymentTerms: false,
        showSupplierDetails: true,
      },
      INVOICE: {
        title: "INVOICE",
        color: "#059669",
        icon: "",
        showPrice: true,
        showTotals: true,
        showVAT: true,
        showDeliveryInfo: false,
        showOnlyProducts: false, // Invoices can show both products and services
        showUnit: false,
        showTotalWeight: false,
        showSKU: true,
        showNotes: true,
        showPaymentTerms: true,
        showSupplierDetails: false,
      },
    };

    return configs[documentType] || configs.INVOICE;
  }

  static generateInvoiceDocumentHTML(
    document: InvoiceDocumentWithRelations,
    companyInfo?: CompanyInfo | null
  ): string {
    // --- COLORS ---
    const colorRed = "#990000";
    const colorGold = "#C5A005";
    const headerGreenBg = "#D1FAE5";
    const headerGreenText = "#065F46";

    // --- DOCUMENT CONFIG ---
    const config = this.getDocumentConfig(document.invoiceDocumentType);
    const documentColor = config.color;
    const isSupplierList = document.invoiceDocumentType === "SUPPLIER_LIST";
    const showSupplierDetails = config.showSupplierDetails;
    const showOnlyProducts = config.showOnlyProducts;

    // --- DATA PREPARATION ---
    const issueDate = new Date(document.issueDate).toLocaleDateString("en-GB");
    const dueDate = document.dueDate
      ? new Date(document.dueDate).toLocaleDateString("en-GB")
      : "N/A";

    // Get company info from document creator's GeneralSetting
    let effectiveCompanyInfo = companyInfo;

    if (
      !effectiveCompanyInfo &&
      document.creator?.GeneralSetting &&
      document.creator.GeneralSetting.length > 0
    ) {
      // Take the first GeneralSetting (assuming one per user)
      effectiveCompanyInfo = document.creator.GeneralSetting[0];
    }

    // Use company info with fallbacks
    const cName =
      effectiveCompanyInfo?.companyName ||
      document.creator?.name ||
      "Company Name";
    const cAddress = effectiveCompanyInfo?.Address || "";
    const cCity = effectiveCompanyInfo?.city || "";
    const cCode = effectiveCompanyInfo?.postCode || "";
    const cProv = effectiveCompanyInfo?.province || "";
    const cVat = effectiveCompanyInfo?.taxId || "";
    const cPhone =
      effectiveCompanyInfo?.phone || effectiveCompanyInfo?.phone1 || "";
    const cPhone2 = effectiveCompanyInfo?.phone2 || "";
    const cPhone3 = effectiveCompanyInfo?.phone3 || "";
    const cEmail = effectiveCompanyInfo?.email || document.creator?.email || "";
    const cWeb = effectiveCompanyInfo?.website || "";
    const logo = effectiveCompanyInfo?.logo || "";
    const cBankName = effectiveCompanyInfo?.bankName || "";
    const cBankAccount = effectiveCompanyInfo?.bankAccount || "";
    const cBankName2 = effectiveCompanyInfo?.bankName2 || "";
    const cBankAccount2 = effectiveCompanyInfo?.bankAccount2 || "";

    // Get document discount information
    const discountAmount = this.decimalToNumber(document.discountAmount) || 0;
    const discountType = (document as any).discountType || "PERCENTAGE"; // Default to PERCENTAGE
    const isAmountDiscount = discountType === "AMOUNT";

    // --- CLIENT/SUPPLIER INFO LOGIC ---
    // Supplier List should always show supplier info if available
    const showSupplier = isSupplierList || document.supplier;
    const contact = showSupplier ? document.supplier : document.client;

    const contactName = contact?.name || "";
    const contactFullName = (contact as any)?.fullName || "";
    const contactTaxNumber = (contact as any)?.taxNumber || "";
    const contactRegNumber = (contact as any)?.registrationNumber || "";
    const contactType = (contact as any)?.type || "";
    const contactCurrency = (contact as any)?.currency || "ZAR";
    const contactWebsite = (contact as any)?.website || "";
    const terms = (contact as any)?.paymentTerms || "";
    const contactNotes = (contact as any)?.notes || "";

    let contactAddress = "";
    let contactCity = "";
    let contactCode = "";
    let contactProvince = "";
    let contactPhone = "";
    let contactPhone2 = "";
    let contactEmail = "";

    if (showSupplier && document.supplier) {
      // Supplier info - using Vendor model fields
      contactAddress = (document.supplier as any)?.address || "";
      contactCity = (document.supplier as any)?.city || "";
      contactCode = (document.supplier as any)?.postalCode || "";
      contactProvince = (document.supplier as any)?.state || "";
      contactPhone = document.supplier.phone || "";
      contactPhone2 = (document.supplier as any)?.phone2 || "";
      contactEmail = document.supplier.email || "";
    } else if (document.client) {
      // Client info
      contactAddress = document.client.address || "";
      contactCity = document.client.city || "";
      contactCode = document.client.postalCode || "";
      contactProvince = document.client.province || "";
      contactPhone = document.client.phone || "";
      contactEmail = document.client.email || "";
    }

    // Determine the contact label
    const contactLabel = isSupplierList
      ? "SUPPLIER"
      : document.supplier
        ? "SUPPLIER"
        : "CLIENT";

    // Generate detailed supplier info section if configured to show
    let detailedSupplierInfo = "";
    if (showSupplierDetails && document.supplier) {
      detailedSupplierInfo = `
          <div class="supplier-details-section" style="margin-top: 10px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; border: 1px solid #e9ecef;">
            <div style="font-weight: bold; margin-bottom: 5px; color: #495057; font-size: 11px;">SUPPLIER DETAILS:</div>
            <table style="width: 100%; font-size: 10px;">
              ${contactFullName ? `<tr><td style="width: 35%; padding: 2px 0; color: #6c757d;">Full Name:</td><td style="font-weight: bold;">${contactFullName}</td></tr>` : ""}
              ${contactTaxNumber ? `<tr><td style="width: 35%; padding: 2px 0; color: #6c757d;">Tax Number:</td><td style="font-weight: bold;">${contactTaxNumber}</td></tr>` : ""}
              ${contactRegNumber ? `<tr><td style="width: 35%; padding: 2px 0; color: #6c757d;">Reg Number:</td><td style="font-weight: bold;">${contactRegNumber}</td></tr>` : ""}
              ${contactType ? `<tr><td style="width: 35%; padding: 2px 0; color: #6c757d;">Type:</td><td style="font-weight: bold;">${contactType}</td></tr>` : ""}
              ${contactCurrency ? `<tr><td style="width: 35%; padding: 2px 0; color: #6c757d;">Currency:</td><td style="font-weight: bold;">${contactCurrency}</td></tr>` : ""}
              ${contactPhone2 ? `<tr><td style="width: 35%; padding: 2px 0; color: #6c757d;">Secondary Phone:</td><td style="font-weight: bold;">${contactPhone2}</td></tr>` : ""}
              ${contactWebsite ? `<tr><td style="width: 35%; padding: 2px 0; color: #6c757d;">Terms:</td><td style="font-weight: bold;">${terms}</td></tr>` : ""}
            </table>
            ${contactNotes ? `<div style="margin-top: 5px; font-size: 9px; color: #6c757d;"><strong>Notes:</strong> ${contactNotes}</div>` : ""}
          </div>
        `;
    }

    // --- SEPARATE ITEMS INTO PRODUCTS AND SERVICES ---
    const productItems: Array<{
      description: string;
      qty: number;
      unitPrice: number;
      linePrice: number;
      unitOfMeasure: string;
      taxRate: number;
      vat: number;
      total: number;
      weight: number;
      totalWeight: number;
      productName: string;
      sku: string;
      isService: boolean;
    }> = [];

    const serviceItems: Array<{
      description: string;
      qty: number;
      unitPrice: number;
      linePrice: number;
      unitOfMeasure: string;
      taxRate: number;
      vat: number;
      total: number;
      weight: number;
      totalWeight: number;
      productName: string;
      sku: string;
      isService: boolean;
    }> = [];

    // Track totals for calculations
    let subtotalGross = 0; // Total before discount
    let subtotalNet = 0; // Total after discount (before VAT)
    let totalVat = 0;
    let totalWeight = 0;

    // Process all items
    document.items.forEach((item: DocumentItem) => {
      // Convert Decimal to number
      const qty = this.decimalToNumber(item.quantity);
      const unitPrice = config.showPrice
        ? this.decimalToNumber(item.unitPrice)
        : 0;
      const taxRate = this.decimalToNumber(item.taxRate || 15);
      const unitOfMeasure = item.unitOfMeasure || "pcs";

      // Calculate item amounts
      const linePrice = qty * unitPrice;
      const net = linePrice; // Line item net (discount is applied at document level)
      const vat = net * (taxRate / 100);
      const total = net + vat;

      subtotalGross += linePrice;
      subtotalNet += net;
      totalVat += vat;

      // Get product weight if available
      const itemWeight = item.product?.weight
        ? this.decimalToNumber(item.product.weight)
        : 0;
      const itemTotalWeight = itemWeight * qty;
      totalWeight += itemTotalWeight;

      const itemData = {
        description: item.description,
        qty,
        unitPrice,
        linePrice,
        unitOfMeasure,
        taxRate,
        vat,
        total,
        weight: itemWeight,
        totalWeight: itemTotalWeight,
        productName: item.product?.name || "",
        sku: item.product?.sku || "",
        isService: false,
      };

      // Determine if item is product or service
      // For document items, we need to check different properties
      // Service items typically have serviceId or description hints
      const descLower = item.description?.toLowerCase() || "";
      const isService =
        (item as any).serviceId || // Check if it has serviceId
        descLower.includes("service") ||
        descLower.includes("labour") ||
        descLower.includes("install") ||
        descLower.includes("consult") ||
        descLower.includes("support") ||
        descLower.includes("maintenance");

      if (isService && !showOnlyProducts) {
        // Only add services if document type allows them
        serviceItems.push({ ...itemData, isService: true });
      } else {
        productItems.push({ ...itemData, isService: false });
      }
    });

    // --- CREATE COMBINED SERVICES ROW (if document type allows services) ---
    let combinedServicesData: CombinedServiceData | null = null;

    if (serviceItems.length > 0 && !showOnlyProducts) {
      // Calculate combined totals
      let totalQuantity = 0;
      let totalLinePrice = 0;
      let totalDiscount = 0;
      let totalNet = 0;
      let totalVatServices = 0;
      let totalAmountServices = 0;
      const serviceDescriptions: string[] = [];

      serviceItems.forEach((service) => {
        totalQuantity += service.qty;
        totalLinePrice += service.linePrice;
        totalNet += service.total - service.vat;
        totalVatServices += service.vat;
        totalAmountServices += service.total;

        if (service.description) {
          serviceDescriptions.push(service.description);
        }
      });

      // Calculate weighted average unit price (not shown but used for calculations)
      const averageUnitPrice =
        totalQuantity > 0 ? totalLinePrice / totalQuantity : 0;

      combinedServicesData = {
        description: `Services Package (${serviceItems.length} services)`,
        quantity: totalQuantity,
        unitPrice: averageUnitPrice,
        linePrice: totalLinePrice,
        discountInput: "0.00", // Services in documents typically don't have individual discounts
        vat: totalVatServices,
        total: totalAmountServices,
        individualServices: serviceItems.map((s) => ({
          description: s.description,
          qty: s.qty,
          unitPrice: s.unitPrice,
          linePrice: s.linePrice,
          discountInput: "0.00",
          vat: s.vat,
          total: s.total,
        })),
        displayType: "combined-service",
      };
    }

    // Apply document-level discount based on discount type
    let calculatedDiscountAmount = 0;
    let discountPercentage = 0;

    if (discountAmount > 0) {
      if (isAmountDiscount) {
        // Fixed amount discount
        calculatedDiscountAmount = discountAmount;
        if (subtotalGross > 0) {
          discountPercentage = (calculatedDiscountAmount / subtotalGross) * 100;
        }
      } else {
        // Percentage discount
        discountPercentage = discountAmount; // discountAmount is the percentage
        calculatedDiscountAmount = subtotalGross * (discountPercentage / 100);
      }

      // Apply discount to subtotal
      subtotalNet = subtotalGross - calculatedDiscountAmount;

      // Recalculate VAT based on discounted amount
      totalVat = subtotalNet * 0.15; // Assuming 15% VAT
    }

    const finalTotal = subtotalNet + totalVat;

    // Type-specific info
    let additionalInfo = "";
    if (config.showDeliveryInfo) {
      additionalInfo = `
          ${document.shippingTrackingNumber ? `<tr><td class="label-cell">Tracking No.:</td><td class="value-cell">${document.shippingTrackingNumber}</td></tr>` : ""}
        `;
    }

    if (document.invoiceDocumentType === "PURCHASE_ORDER") {
      additionalInfo = `
          <tr><td class="label-cell">Supplier:</td><td class="value-cell">${document.supplier?.name || "N/A"}</td></tr>
          ${document.referenceNumber ? `<tr><td class="label-cell">PO Reference:</td><td class="value-cell">${document.referenceNumber}</td></tr>` : ""}
        `;
    }

    if (document.invoiceDocumentType === "CREDIT_NOTE") {
      additionalInfo = `
          <tr><td class="label-cell">Original Invoice:</td><td class="value-cell">${document.invoiceNumber || "N/A"}</td></tr>
        `;
    }

    // Generate table headers based on document type
    let tableHeaders = "";
    let tableColumns = "";
    const showSKU = config.showSKU && config.showOnlyProducts;

    if (config.showPrice) {
      // When showing prices, include both UNIT PRICE and PRICE columns
      tableHeaders = `
          <th class="col-code">#</th>
          <th class="col-desc">DESCRIPTION</th>
          ${showSKU ? `<th class="col-sku">SKU</th>` : ""}
          <th class="col-qty">QTY</th>
          <th class="col-unit-price">UNIT PRICE (R)</th>
          <th class="col-line-price">PRICE (R)</th>
          <th class="col-tax">VAT %</th>
          <th class="col-total">TOTAL (R)</th>
        `;

      // Adjust column widths to accommodate both price columns
      tableColumns = `
          .col-code { width: 4%; text-align: center; }
          .col-desc { width: ${showSKU ? "25%" : "35%"}; text-align: left; }
          ${showSKU ? ".col-sku { width: 8%; text-align: center; }" : ""}
          .col-qty { width: 8%; text-align: center; }
          .col-unit-price { width: 10%; text-align: right; }
          .col-line-price { width: 10%; text-align: right; }
          .col-tax { width: 8%; text-align: center; }
          .col-total { width: 12%; text-align: right; }
        `;
    } else {
      // For non-price documents
      tableHeaders = `
          <th class="col-code">#</th>
          <th class="col-desc">DESCRIPTION</th>
          ${showSKU ? '<th class="col-sku">SKU</th>' : ""}
          <th class="col-qty">QTY</th>
          <th class="col-weight">UNIT WEIGHT</th>
          <th class="col-total-weight">TOTAL WEIGHT</th>
        `;

      const skuColumnWidth = showSKU ? "15%" : "0%";
      const descColumnWidth = showSKU ? "30%" : "45%";

      tableColumns = `
          .col-code { width: 5%; text-align: center; }
          .col-desc { width: ${descColumnWidth}; text-align: left; }
          ${showSKU ? `.col-sku { width: ${skuColumnWidth}; text-align: center; }` : ""}
          .col-qty { width: 10%; text-align: center; }
          .col-weight { width: 15%; text-align: center; }
          .col-total-weight { width: 15%; text-align: center; }
        `;
    }

    // --- BUILD TABLE ROWS ---
    let tableRows = "";

    if (!config.showPrice) {
      // For non-price documents (delivery notes, supplier lists)
      tableRows = productItems
        .map(
          (item, index) => `
          <tr>
            <td class="col-code">${index + 1}</td>
            <td class="col-desc">${item.description || item.productName}</td>
            ${showSKU ? `<td class="col-sku">${item.sku}</td>` : ""}
            <td class="col-qty">${item.qty}</td>
            <td class="col-weight">${item.weight > 0 ? `${item.weight} kg` : "N/A"}</td>
            <td class="col-total-weight">${item.totalWeight > 0 ? `${item.totalWeight.toFixed(3)} kg` : "N/A"}</td>
          </tr>
        `
        )
        .join("");
    } else {
      // For price documents (invoices, pro forma, credit notes)

      // Add product rows
      productItems.forEach((item, index) => {
        tableRows += `
          <tr>
            <td class="col-code">${index + 1}</td>
            <td class="col-desc">${item.description || item.productName}</td>
            ${showSKU ? `<td class="col-sku">${item.sku}</td>` : ""}
            <td class="col-qty">${item.qty}</td>
            <td class="col-unit-price">${this.formatMoney(item.unitPrice)}</td>
            <td class="col-line-price">${this.formatMoney(item.linePrice)}</td>
            <td class="col-tax">${item.taxRate}%</td>
            <td class="col-total">${this.formatMoney(item.total)}</td>
          </tr>
        `;
      });

      // Add combined services row if exists
      if (combinedServicesData && !showOnlyProducts) {
        tableRows += `
          <tr style="background-color: #f8fafc;">
            <td class="col-code">SVC</td>
            <td class="col-desc">
              <strong>${combinedServicesData.description}</strong>
              <div style="font-size: 8px; color: #666; margin-top: 2px; font-style: italic;">
                Includes:
                <ul style="margin: 2px 0 0 12px; padding: 0;">
                  ${serviceItems
                    .slice(0, 3)
                    .map(
                      (service, index) => `
                    <li style="list-style-type: disc; margin-left: 8px;">
                      ${service.description}
                    </li>
                  `
                    )
                    .join("")}
                </ul>
                ${
                  serviceItems.length > 3
                    ? `
                  <div style="margin-left: 12px;">
                    and ${serviceItems.length - 3} more
                  </div>
                `
                    : ""
                }
              </div>
            </td>
            ${showSKU ? `<td class="col-sku">-</td>` : ""}
            <td class="col-qty">${combinedServicesData.quantity}</td>
            <td class="col-unit-price">-</td>
            <td class="col-line-price">${this.formatMoney(combinedServicesData.linePrice)}</td>
            <td class="col-tax">15%</td>
            <td class="col-total"><strong>${this.formatMoney(combinedServicesData.total)}</strong></td>
          </tr>
        `;
      } else if (serviceItems.length > 0 && !showOnlyProducts) {
        // Show services individually if not combined
        const startIndex = productItems.length;
        serviceItems.forEach((item, index) => {
          tableRows += `
            <tr>
              <td class="col-code">${startIndex + index + 1}</td>
              <td class="col-desc">${item.description || item.productName}</td>
              ${showSKU ? `<td class="col-sku">${item.sku}</td>` : ""}
              <td class="col-qty">${item.qty}</td>
              <td class="col-unit-price">${this.formatMoney(item.unitPrice)}</td>
              <td class="col-line-price">${this.formatMoney(item.linePrice)}</td>
              <td class="col-tax">${item.taxRate}%</td>
              <td class="col-total">${this.formatMoney(item.total)}</td>
            </tr>
          `;
        });
      }
    }

    // Generate total weight section for documents that need it
    let totalWeightSection = "";
    if (config.showTotalWeight && totalWeight > 0) {
      totalWeightSection = `
          <div class="total-weight-wrapper">
            <table class="total-weight-table">
              <tr>
                <td class="label-cell" style="font-weight: bold; font-size: 12px;">TOTAL WEIGHT:</td>
                <td class="text-right" style="font-weight: bold; font-size: 12px; color: ${documentColor};">${totalWeight.toFixed(3)} kg</td>
              </tr>
            </table>
          </div>
        `;
    }

    // Get payment terms from document or company info (only if configured to show)
    let paymentTermsSection = "";
    if (config.showPaymentTerms) {
      const paymentTerms =
        document.paymentTerms ||
        effectiveCompanyInfo?.paymentTerms ||
        "Payment due on receipt.";

      paymentTermsSection = `
          <div class="terms-title">PAYMENT TERMS</div>
          <div>${paymentTerms}</div>
        `;
    }

    // Generate notes section (only if configured to show)
    let notesSection = "";
    if (config.showNotes && document.notes) {
      notesSection = `
          <div class="terms-title">NOTES</div>
          <div style="margin-bottom: 10px;">${document.notes}</div>
        `;
    }

    // Generate terms section (only if configured to show)
    let termsSection = "";
    if (config.showNotes && document.terms) {
      termsSection = `
          <div class="terms-title">TERMS & CONDITIONS</div>
          <div style="margin-bottom: 10px;">${document.terms}</div>
        `;
    }

    // Generate thank you message only if no other sections are shown and it's not a supplier list
    let thankYouSection = "";
    if (
      !isSupplierList &&
      !document.notes &&
      !document.terms &&
      !config.showPaymentTerms
    ) {
      thankYouSection = `
          <div>Thank you for your business.</div>
        `;
    }

    return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${config.title} ${document.invoiceDocumentNumber}</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Arial:wght@400;700&display=swap');
              body { font-family: Arial, sans-serif; margin: 0; padding: 40px; font-size: 10px; color: #000; line-height: 1.3; }
              .row { display: flex; width: 100%; gap: 20px; }
              .col-left { width: 60%; }
              .col-right { width: 40%; }
              .logo-img { width: 180px; margin-bottom: 10px; }
              .company-header { font-size: 20px; font-weight: bold; color: #d4af37; margin-bottom: 5px; }
              .company-header span { color: ${colorRed}; }
              .address-block, .reg-info, .contact-info { margin-bottom: 8px; }
              .document-title-main { font-size: 22px; color: ${documentColor}; font-weight: bold; text-align: right; margin-bottom: 15px; }
              
              .details-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
              .details-table td { border: none; padding: 4px 8px; font-weight: bold; }
              .label-cell { width: 40%; text-align: left; color: #555; }
              .value-cell { width: 60%; text-align: right; }
  
              .contact-box-label { font-weight: bold; margin-bottom: 2px; color: #555; }
              .contact-box { border: 1px solid #ddd; border-radius: 4px; padding: 10px; background-color: #fdfdfd; }
              .contact-name { font-weight: bold; font-size: 11px; margin-bottom: 4px; }
  
              .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .items-table th { border: none; padding: 8px 6px; background-color: ${headerGreenBg}; color: ${headerGreenText}; font-weight: bold; text-align: center; font-size: 9px; text-transform: uppercase; }
              .items-table td { border: none; border-bottom: 1px solid #f0f0f0; padding: 8px 6px; vertical-align: top; font-size: 10px; }
              
              ${tableColumns}
  
              .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
              .totals-table { width: 300px; border-collapse: collapse; }
              .totals-table td { border: none; padding: 6px 8px; font-weight: bold; font-size: 11px; }
              .text-right { text-align: right; }
  
              .total-weight-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
              .total-weight-table { width: 300px; border-collapse: collapse; border-top: 2px solid ${documentColor}; }
              .total-weight-table td { border: none; padding: 8px 8px; font-weight: bold; font-size: 11px; }
  
              .terms-section { margin-top: 30px; }
              .terms-title { font-weight: bold; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; color: ${headerGreenText}; }
              .terms-list { padding-left: 15px; margin: 0; }
              .terms-list li { margin-bottom: 2px; }
  
              .footer-strip { margin-top: 40px; border-top: 1px solid #eee; padding: 10px 5px; text-align: center; font-size: 9px; font-weight: bold; color: #555; }
              
              .status-badge { display: inline-block; padding: 3px 10px; border-radius: 3px; font-size: 9px; font-weight: bold; margin-left: 10px; background-color: ${headerGreenBg}; color: ${headerGreenText}; }
              
              @page { size: A4; margin: 1cm; }
              @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
          </head>
          <body>
            <div class="row">
              <div class="col-left">
                ${logo ? `<img src="${logo}" class="logo-img" />` : ""}
                ${!logo ? `<div class="company-header">${cName}</div>` : ""}
                <div class="address-block"><strong>${cName}</strong><br>${cAddress}<br>${cCity} ${cCode}<br>${cProv}</div>
                ${cVat ? `<div class="reg-info">VAT No.: ${cVat}</div>` : ""}
               
                <div class="contact-info">
                  ${cPhone ? `${cPhone}<br>` : ""}
                  ${cPhone2 ? `${cPhone2}<br>` : ""}
                  ${cPhone3 ? `${cPhone3}<br>` : ""}
                  ${cEmail ? `${cEmail}<br>` : ""}
                  ${cWeb ? `${cWeb}` : ""}
                </div>
              </div>
            
              <div class="col-right">
                <div class="document-title-main">
                  ${config.title} 
                </div>
                
                <table class="details-table">
                  <tr><td class="label-cell">Document No.:</td><td class="value-cell">${document.invoiceDocumentNumber}</td></tr>
                  <tr><td class="label-cell">Date:</td><td class="value-cell">${issueDate}</td></tr>
                  ${document.dueDate ? `<tr><td class="label-cell">Due Date:</td><td class="value-cell">${dueDate}</td></tr>` : ""}
                  ${
                    document.creator && document.creator.name
                      ? `<tr><td class="label-cell">Prepared by:</td><td class="value-cell">${document.creator.name}</td></tr>`
                      : ""
                  }
                  ${additionalInfo}
                  ${document.referenceNumber ? `<tr><td class="label-cell">Reference:</td><td class="value-cell">${document.referenceNumber}</td></tr>` : ""}
                </table>
                
                <div class="contact-box-label">${contactLabel}</div>
                <div class="contact-box">
                  <div class="contact-name">${contactName}</div>
                  ${contactAddress ? `${contactAddress}<br>` : ""}
                  ${contactCity || contactCode ? `${contactCity} ${contactCode}<br>` : ""}
                  ${contactProvince ? `${contactProvince}<br>` : ""}
                  ${contactPhone ? `${contactPhone}<br>` : ""}
                  ${contactPhone2 ? `${contactPhone2}<br>` : ""}
                  ${contactEmail ? `${contactEmail}` : ""}
                  ${contactWebsite ? `<br>Website: ${contactWebsite}` : ""}
                </div>
                
                ${detailedSupplierInfo}
              </div>
            </div>
  
            <table class="items-table">
              <thead>
                <tr>
                  ${tableHeaders}
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>
  
            ${config.showTotalWeight ? totalWeightSection : ""}
  
            ${
              config.showTotals
                ? `
              <div class="totals-wrapper">
                <table class="totals-table">
                  <tr><td class="label-cell">SUBTOTAL:</td><td class="text-right">R${this.formatMoney(subtotalGross)}</td></tr>
                  ${
                    calculatedDiscountAmount > 0
                      ? `
                    <tr>
                      <td class="label-cell">DISCOUNT ${isAmountDiscount ? "" : `(${discountPercentage.toFixed(2)}%)`}:</td>
                      <td class="text-right" style="color: #dc2626;">-R${this.formatMoney(calculatedDiscountAmount)}</td>
                    </tr>
                    <tr><td class="label-cell">NET TOTAL:</td><td class="text-right">R${this.formatMoney(subtotalNet)}</td></tr>
                  `
                      : ""
                  }
                  ${config.showVAT ? `<tr><td class="label-cell">VAT (15%):</td><td class="text-right">R${this.formatMoney(totalVat)}</td></tr>` : ""}
                  <tr style="border-top: 2px solid ${documentColor}; color: ${documentColor};">
                    <td class="label-cell" style="font-size: 12px;">TOTAL DUE:</td>
                    <td class="text-right" style="font-size: 12px;">R${this.formatMoney(finalTotal)}</td>
                  </tr>
                </table>
              </div>
            `
                : ""
            }
  
            ${
              notesSection ||
              termsSection ||
              paymentTermsSection ||
              thankYouSection
                ? `
              <div class="terms-section">
                ${notesSection}
                ${termsSection}
                ${paymentTermsSection}
                ${thankYouSection}
              </div>
              `
                : ""
            }
  
            ${
              cBankName || cBankName2
                ? `
              <div class="footer-strip">
                Account holder: ${cName} &nbsp;&nbsp;
                ${cBankName ? `Bank: ${cBankName} Account No.: ${cBankAccount} &nbsp;&nbsp;` : ""}
                ${cBankName2 ? `Bank: ${cBankName2} Account No.: ${cBankAccount2}` : ""}
              </div>
            `
                : ""
            }
  
          </body>
        </html>
      `;
  }
}
