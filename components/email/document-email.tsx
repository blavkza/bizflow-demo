// components/email/invoice-document-email.tsx
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Column,
  Row,
  Text,
  Img,
  Link,
  Preview,
} from "@react-email/components";
import { InvoiceDocumentWithRelations } from "@/types/invoice-document";

interface CompanyInfo {
  companyName?: string;
  address?: string;
  city?: string;
  province?: string;
  postCode?: string;
  phone?: string;
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

interface InvoiceDocumentEmailProps {
  document: InvoiceDocumentWithRelations;
  companyInfo?: CompanyInfo | null;
}

export function InvoiceDocumentEmail({
  document,
  companyInfo,
}: InvoiceDocumentEmailProps) {
  // --- DOCUMENT TYPE CONFIGURATION ---
  const getDocumentConfig = (documentType: string) => {
    const configs: Record<string, any> = {
      DELIVERY_NOTE: {
        title: "DELIVERY NOTE",
        color: "#1e40af",
        showPrice: false,
        showTotals: false,
        showVAT: false,
        showDeliveryInfo: true,
        showOnlyProducts: true,
        showTotalWeight: true,
        showSKU: true,
        showPaymentTerms: true,
      },
      PURCHASE_ORDER: {
        title: "PURCHASE ORDER",
        color: "#ea580c",
        showPrice: true,
        showTotals: true,
        showVAT: true,
        showDeliveryInfo: false,
        showOnlyProducts: true,
        showTotalWeight: false,
        showSKU: true,
        showPaymentTerms: true,
      },
      PRO_FORMA_INVOICE: {
        title: "PRO FORMA INVOICE",
        color: "#7c3aed",
        showPrice: true,
        showTotals: true,
        showVAT: true,
        showDeliveryInfo: false,
        showOnlyProducts: false,
        showTotalWeight: false,
        showSKU: true,
        showPaymentTerms: true,
      },
      CREDIT_NOTE: {
        title: "CREDIT NOTE",
        color: "#dc2626",
        showPrice: true,
        showTotals: true,
        showVAT: true,
        showDeliveryInfo: false,
        showOnlyProducts: false,
        showTotalWeight: false,
        showSKU: true,
        showPaymentTerms: true,
      },
      SUPPLIER_LIST: {
        title: "SUPPLIER LIST",
        color: "#475569",
        showPrice: false,
        showTotals: false,
        showVAT: false,
        showDeliveryInfo: false,
        showOnlyProducts: true,
        showTotalWeight: true,
        showSKU: false,
        showPaymentTerms: false,
      },
      INVOICE: {
        title: "INVOICE",
        color: "#059669",
        showPrice: true,
        showTotals: true,
        showVAT: true,
        showDeliveryInfo: false,
        showOnlyProducts: false,
        showTotalWeight: false,
        showSKU: true,
        showPaymentTerms: true,
      },
    };

    return configs[documentType] || configs.INVOICE;
  };

  // --- BRAND COLORS ---
  const colorRed = "#990000";
  const colorGold = "#C5A005";
  const headerGreenBg = "#D1FAE5";
  const headerGreenText = "#065F46";

  // --- DOCUMENT CONFIG ---
  const config = getDocumentConfig(document.invoiceDocumentType);
  const documentColor = config.color;
  const isSupplierList = document.invoiceDocumentType === "SUPPLIER_LIST";

  // --- DATA PREPARATION ---
  const issueDate = new Date(document.issueDate).toLocaleDateString("en-GB");
  const dueDate = document.dueDate
    ? new Date(document.dueDate).toLocaleDateString("en-GB")
    : "N/A";

  // Use company info with fallbacks
  const cName =
    companyInfo?.companyName || document.creator?.name || "Company Name";
  const cAddress = companyInfo?.address || "";
  const cCity = companyInfo?.city || "";
  const cCode = companyInfo?.postCode || "";
  const cProv = companyInfo?.province || "";
  const cVat = companyInfo?.taxId || "";
  const cPhone = companyInfo?.phone || "";
  const cPhone2 = companyInfo?.phone2 || "";
  const cPhone3 = companyInfo?.phone3 || "";
  const cEmail = companyInfo?.email || document.creator?.email || "";
  const cWeb = companyInfo?.website || "";
  const logo = companyInfo?.logo || "";
  const cBankName = companyInfo?.bankName || "";
  const cBankAccount = companyInfo?.bankAccount || "";
  const cBankName2 = companyInfo?.bankName2 || "";
  const cBankAccount2 = companyInfo?.bankAccount2 || "";

  // --- HELPER FUNCTIONS ---
  const formatMultiLineText = (text: string) => {
    if (!text) return "";
    // Convert newlines to HTML breaks
    return text.replace(/\n/g, "<br />");
  };

  // --- CLIENT/SUPPLIER INFO ---
  const showSupplier = isSupplierList || document.supplier;
  const contact = showSupplier ? document.supplier : document.client;

  const contactName = contact?.name || "";
  let contactAddress = "";
  let contactCity = "";
  let contactCode = "";
  let contactProvince = "";
  let contactPhone = "";
  let contactEmail = "";

  if (showSupplier && document.supplier) {
    contactAddress = (document.supplier as any)?.address || "";
    contactCity = (document.supplier as any)?.city || "";
    contactCode = (document.supplier as any)?.postalCode || "";
    contactProvince = (document.supplier as any)?.state || "";
    // Format phone with proper line breaks
    contactPhone = formatMultiLineText(document.supplier.phone || "");
    contactEmail = document.supplier.email || "";
  } else if (document.client) {
    contactAddress = document.client.address || "";
    contactCity = document.client.city || "";
    contactCode = document.client.postalCode || "";
    contactProvince = document.client.province || "";
    // Format phone with proper line breaks
    contactPhone = formatMultiLineText(document.client.phone || "");
    contactEmail = document.client.email || "";
  }

  // Determine the contact label
  const contactLabel = isSupplierList
    ? "SUPPLIER"
    : document.supplier
      ? "SUPPLIER"
      : "CLIENT";

  // --- CALCULATIONS ---
  const formatMoney = (amount: number) =>
    amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const safeNumber = (val: any) => {
    if (!val) return 0;
    return Number(val);
  };

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
    sku: string;
    isService: boolean;
  }> = [];

  // Process all items
  let subtotalGross = 0;
  let totalVat = 0;
  let totalWeight = 0;

  document.items.forEach((item: any) => {
    const qty = safeNumber(item.quantity);
    const unitPrice = config.showPrice ? safeNumber(item.unitPrice) : 0;
    const taxRate = safeNumber(item.taxRate || 15);
    const linePrice = qty * unitPrice;
    const vat = linePrice * (taxRate / 100);
    const total = linePrice + vat;

    subtotalGross += linePrice;
    totalVat += vat;

    // Get product weight if available
    const itemWeight = item.product?.weight
      ? safeNumber(item.product.weight)
      : 0;
    const itemTotalWeight = itemWeight * qty;
    totalWeight += itemTotalWeight;

    const itemData = {
      description: item.description,
      qty,
      unitPrice,
      linePrice,
      unitOfMeasure: item.unitOfMeasure || "pcs",
      taxRate,
      vat,
      total,
      weight: itemWeight,
      totalWeight: itemTotalWeight,
      sku: item.product?.sku || "",
      isService: false,
    };

    // Determine if item is product or service
    const descLower = item.description?.toLowerCase() || "";
    const isService =
      (item as any).serviceId ||
      descLower.includes("service") ||
      descLower.includes("labour") ||
      descLower.includes("install") ||
      descLower.includes("consult") ||
      descLower.includes("support") ||
      descLower.includes("maintenance");

    if (isService && !config.showOnlyProducts) {
      serviceItems.push({ ...itemData, isService: true });
    } else {
      productItems.push({ ...itemData, isService: false });
    }
  });

  // --- CREATE COMBINED SERVICES DATA ---
  let combinedServicesData: {
    description: string;
    quantity: number;
    linePrice: number;
    vat: number;
    total: number;
    individualServices: Array<any>;
  } | null = null;

  if (serviceItems.length > 0 && !config.showOnlyProducts) {
    let totalQuantity = 0;
    let totalLinePrice = 0;
    let totalVatServices = 0;
    let totalAmountServices = 0;
    const serviceDescriptions: string[] = [];

    serviceItems.forEach((service) => {
      totalQuantity += service.qty;
      totalLinePrice += service.linePrice;
      totalVatServices += service.vat;
      totalAmountServices += service.total;

      if (service.description) {
        serviceDescriptions.push(service.description);
      }
    });

    combinedServicesData = {
      description: `Services Package (${serviceItems.length} services)`,
      quantity: totalQuantity,
      linePrice: totalLinePrice,
      vat: totalVatServices,
      total: totalAmountServices,
      individualServices: serviceItems,
    };
  }

  // --- BUILD TABLE ROWS ---
  const tableRows: JSX.Element[] = [];
  const showSKU = config.showSKU && config.showOnlyProducts;

  if (!config.showPrice) {
    // For non-price documents
    productItems.forEach((item, index) => {
      tableRows.push(
        <tr key={`product-${index}`}>
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {index + 1}
          </td>
          <td
            style={{
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {item.description}
          </td>
          {showSKU && (
            <td
              style={{
                textAlign: "center",
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {item.sku}
            </td>
          )}
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {item.qty}
          </td>
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {item.weight > 0 ? `${item.weight} kg` : "N/A"}
          </td>
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {item.totalWeight > 0 ? `${item.totalWeight.toFixed(3)} kg` : "N/A"}
          </td>
        </tr>
      );
    });
  } else {
    // For price documents
    // Add product rows
    productItems.forEach((item, index) => {
      tableRows.push(
        <tr key={`product-${index}`}>
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {index + 1}
          </td>
          <td
            style={{
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {item.description}
          </td>
          {showSKU && (
            <td
              style={{
                textAlign: "center",
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {item.sku}
            </td>
          )}
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {item.qty}
          </td>
          <td
            style={{
              textAlign: "right",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            R{formatMoney(item.unitPrice)}
          </td>
          <td
            style={{
              textAlign: "right",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            R{formatMoney(item.linePrice)}
          </td>
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {item.taxRate}%
          </td>
          <td
            style={{
              textAlign: "right",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            R{formatMoney(item.total)}
          </td>
        </tr>
      );
    });

    // Add combined services row if exists
    if (combinedServicesData && !config.showOnlyProducts) {
      tableRows.push(
        <tr key="combined-services" style={{ backgroundColor: "#f8fafc" }}>
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
              fontWeight: "bold",
            }}
          >
            SVC
          </td>
          <td
            style={{
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div style={{ fontWeight: "bold" }}>
              {combinedServicesData.description}
            </div>
            <div
              style={{
                fontSize: "8px",
                color: "#666",
                marginTop: "2px",
                fontStyle: "italic",
              }}
            >
              Includes:
              <ul style={{ margin: "2px 0 0 12px", padding: "0" }}>
                {serviceItems.slice(0, 3).map((service, index) => (
                  <li
                    key={index}
                    style={{ listStyleType: "disc", marginLeft: "8px" }}
                  >
                    {service.description}
                  </li>
                ))}
              </ul>
              {serviceItems.length > 3 && (
                <div style={{ marginLeft: "12px" }}>
                  and {serviceItems.length - 3} more
                </div>
              )}
            </div>
          </td>
          {showSKU && (
            <td
              style={{
                textAlign: "center",
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              -
            </td>
          )}
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            {combinedServicesData.quantity}
          </td>
          <td
            style={{
              textAlign: "right",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
              fontStyle: "italic",
            }}
          >
            -
          </td>
          <td
            style={{
              textAlign: "right",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            R{formatMoney(combinedServicesData.linePrice)}
          </td>
          <td
            style={{
              textAlign: "center",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            15%
          </td>
          <td
            style={{
              textAlign: "right",
              padding: "8px 6px",
              fontSize: "10px",
              borderBottom: "1px solid #f0f0f0",
              fontWeight: "bold",
            }}
          >
            R{formatMoney(combinedServicesData.total)}
          </td>
        </tr>
      );
    } else if (serviceItems.length > 0 && !config.showOnlyProducts) {
      // Show services individually if not combined
      const startIndex = productItems.length;
      serviceItems.forEach((item, index) => {
        tableRows.push(
          <tr key={`service-${index}`}>
            <td
              style={{
                textAlign: "center",
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {startIndex + index + 1}
            </td>
            <td
              style={{
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {item.description}
            </td>
            {showSKU && (
              <td
                style={{
                  textAlign: "center",
                  padding: "8px 6px",
                  fontSize: "10px",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                {item.sku}
              </td>
            )}
            <td
              style={{
                textAlign: "center",
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {item.qty}
            </td>
            <td
              style={{
                textAlign: "right",
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              R{formatMoney(item.unitPrice)}
            </td>
            <td
              style={{
                textAlign: "right",
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              R{formatMoney(item.linePrice)}
            </td>
            <td
              style={{
                textAlign: "center",
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              {item.taxRate}%
            </td>
            <td
              style={{
                textAlign: "right",
                padding: "8px 6px",
                fontSize: "10px",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              R{formatMoney(item.total)}
            </td>
          </tr>
        );
      });
    }
  }

  // Calculate final total
  const finalTotal = subtotalGross + totalVat;

  return (
    <Html>
      <Head>
        <style>{`
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
              
              .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
              .totals-table { width: 300px; border-collapse: collapse; }
              .totals-table td { border: none; padding: 6px 8px; font-weight: bold; font-size: 11px; }
              .text-right { text-align: right; }
    
              .total-weight-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
              .total-weight-table { width: 300px; border-collapse: collapse; border-top: 2px solid ${documentColor}; }
              .total-weight-table td { border: none; padding: 8px 8px; font-weight: bold; font-size: 11px; }
    
              .terms-section { margin-top: 30px; }
              .terms-title { font-weight: bold; font-size: 11px; margin-bottom: 5px; text-transform: uppercase; color: ${headerGreenText}; }
    
              .footer-strip { margin-top: 40px; border-top: 1px solid #eee; padding: 10px 5px; text-align: center; font-size: 9px; font-weight: bold; color: #555; }
            `}</style>
      </Head>
      <Preview>
        {config.title} {document.invoiceDocumentNumber} from {cName}
      </Preview>
      <Body
        style={{ backgroundColor: "#ffffff", margin: "0", padding: "20px" }}
      >
        <Container style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* --- HEADER SECTION --- */}
          <Section style={{ marginBottom: "20px" }}>
            <Row>
              {/* LEFT: Company Info */}
              <Column
                style={{
                  width: "60%",
                  paddingRight: "20px",
                  verticalAlign: "top",
                }}
              >
                {logo ? (
                  <Img
                    src={logo}
                    width="150"
                    alt="Logo"
                    style={{ marginBottom: "10px", objectFit: "contain" }}
                  />
                ) : (
                  <Text style={{ margin: "0 0 5px 0" }}>
                    <span
                      style={{
                        color: "#d4af37",
                        fontWeight: "bold",
                        fontSize: "20px",
                      }}
                    >
                      {cName}
                    </span>
                  </Text>
                )}

                <div
                  style={{ fontSize: "11px", lineHeight: "1.4", margin: "0" }}
                >
                  <div>
                    <strong>{cName}</strong>
                  </div>
                  {cAddress && <div>{cAddress}</div>}
                  {(cCity || cCode) && (
                    <div>
                      {cCity} {cCode}
                    </div>
                  )}
                  {cProv && <div>{cProv}</div>}
                </div>

                {cVat && (
                  <div
                    style={{
                      fontSize: "11px",
                      lineHeight: "1.4",
                      margin: "10px 0 0 0",
                    }}
                  >
                    <strong>VAT No.:</strong> {cVat}
                  </div>
                )}

                <div
                  style={{
                    fontSize: "11px",
                    lineHeight: "1.4",
                    margin: "10px 0 0 0",
                  }}
                >
                  {cPhone && <div>{cPhone}</div>}
                  {cPhone2 && <div>{cPhone2}</div>}
                  {cPhone3 && <div>{cPhone3}</div>}
                  {cEmail && <div>{cEmail}</div>}
                  {cWeb && <div>{cWeb}</div>}
                </div>
              </Column>

              {/* RIGHT: Document Details */}
              <Column style={{ width: "40%", verticalAlign: "top" }}>
                <Text
                  style={{
                    fontSize: "22px",
                    color: documentColor,
                    fontWeight: "bold",
                    textAlign: "right",
                    margin: "0 0 10px 0",
                    textDecoration: "underline",
                  }}
                >
                  {config.title}
                </Text>

                {/* Details Table */}
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: "15px",
                  }}
                >
                  <tr>
                    <td
                      style={{
                        width: "40%",
                        fontSize: "11px",
                        fontWeight: "bold",
                        padding: "4px",
                        color: "#555",
                      }}
                    >
                      Document No.:
                    </td>
                    <td
                      style={{
                        width: "60%",
                        fontSize: "11px",
                        fontWeight: "bold",
                        textAlign: "right",
                        padding: "4px",
                      }}
                    >
                      {document.invoiceDocumentNumber}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        padding: "4px",
                        color: "#555",
                      }}
                    >
                      Date:
                    </td>
                    <td
                      style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        textAlign: "right",
                        padding: "4px",
                      }}
                    >
                      {issueDate}
                    </td>
                  </tr>
                  {document.dueDate && (
                    <tr>
                      <td
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          padding: "4px",
                          color: "#555",
                        }}
                      >
                        Due Date:
                      </td>
                      <td
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          textAlign: "right",
                          padding: "4px",
                        }}
                      >
                        {dueDate}
                      </td>
                    </tr>
                  )}
                  {document.referenceNumber && (
                    <tr>
                      <td
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          padding: "4px",
                          color: "#555",
                        }}
                      >
                        Reference:
                      </td>
                      <td
                        style={{
                          fontSize: "11px",
                          fontWeight: "bold",
                          textAlign: "right",
                          padding: "4px",
                        }}
                      >
                        {document.referenceNumber}
                      </td>
                    </tr>
                  )}
                </table>

                <Text
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    margin: "0 0 2px 0",
                    color: "#555",
                  }}
                >
                  {contactLabel}
                </Text>
                <div
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    padding: "8px",
                    backgroundColor: "#fdfdfd",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      margin: "0 0 4px 0",
                    }}
                  >
                    {contactName}
                  </Text>
                  <div style={{ fontSize: "11px", lineHeight: "1.3" }}>
                    {contactAddress && <div>{contactAddress}</div>}
                    {(contactCity || contactCode) && (
                      <div>
                        {contactCity} {contactCode}
                      </div>
                    )}
                    {contactProvince && <div>{contactProvince}</div>}
                    {contactPhone && (
                      <div dangerouslySetInnerHTML={{ __html: contactPhone }} />
                    )}
                    {contactEmail && <div>{contactEmail}</div>}
                  </div>
                </div>
              </Column>
            </Row>
          </Section>

          {/* --- ITEMS TABLE --- */}
          <Section>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {config.showPrice ? (
                    <>
                      <th
                        style={{
                          width: "4%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          width: showSKU ? "25%" : "35%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "left",
                          textTransform: "uppercase",
                        }}
                      >
                        DESCRIPTION
                      </th>
                      {showSKU && (
                        <th
                          style={{
                            width: "8%",
                            backgroundColor: headerGreenBg,
                            color: headerGreenText,
                            padding: "8px 6px",
                            fontSize: "9px",
                            fontWeight: "bold",
                            textAlign: "center",
                            textTransform: "uppercase",
                          }}
                        >
                          SKU
                        </th>
                      )}
                      <th
                        style={{
                          width: "8%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      >
                        QTY
                      </th>
                      <th
                        style={{
                          width: "10%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "right",
                          textTransform: "uppercase",
                        }}
                      >
                        UNIT PRICE (R)
                      </th>
                      <th
                        style={{
                          width: "10%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "right",
                          textTransform: "uppercase",
                        }}
                      >
                        PRICE (R)
                      </th>
                      <th
                        style={{
                          width: "8%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      >
                        VAT %
                      </th>
                      <th
                        style={{
                          width: "12%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "right",
                          textTransform: "uppercase",
                        }}
                      >
                        TOTAL (R)
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        style={{
                          width: "5%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      >
                        #
                      </th>
                      <th
                        style={{
                          width: showSKU ? "30%" : "45%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "left",
                          textTransform: "uppercase",
                        }}
                      >
                        DESCRIPTION
                      </th>
                      {showSKU && (
                        <th
                          style={{
                            width: "15%",
                            backgroundColor: headerGreenBg,
                            color: headerGreenText,
                            padding: "8px 6px",
                            fontSize: "9px",
                            fontWeight: "bold",
                            textAlign: "center",
                            textTransform: "uppercase",
                          }}
                        >
                          SKU
                        </th>
                      )}
                      <th
                        style={{
                          width: "10%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      >
                        QTY
                      </th>
                      <th
                        style={{
                          width: "15%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      >
                        UNIT WEIGHT
                      </th>
                      <th
                        style={{
                          width: "15%",
                          backgroundColor: headerGreenBg,
                          color: headerGreenText,
                          padding: "8px 6px",
                          fontSize: "9px",
                          fontWeight: "bold",
                          textAlign: "center",
                          textTransform: "uppercase",
                        }}
                      >
                        TOTAL WEIGHT
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>{tableRows}</tbody>
            </table>
          </Section>

          {/* --- TOTALS SECTION --- */}
          {config.showTotals && (
            <Section style={{ marginTop: "20px" }}>
              <Row>
                <Column style={{ width: "60%" }} />
                <Column style={{ width: "40%" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <tr>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        SUBTOTAL:
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          textAlign: "right",
                        }}
                      >
                        R{formatMoney(subtotalGross)}
                      </td>
                    </tr>
                    {config.showVAT && (
                      <tr>
                        <td
                          style={{
                            padding: "6px 8px",
                            fontSize: "11px",
                            fontWeight: "bold",
                          }}
                        >
                          VAT (15%):
                        </td>
                        <td
                          style={{
                            padding: "6px 8px",
                            fontSize: "11px",
                            fontWeight: "bold",
                            textAlign: "right",
                          }}
                        >
                          R{formatMoney(totalVat)}
                        </td>
                      </tr>
                    )}
                    <tr
                      style={{
                        borderTop: `2px solid ${documentColor}`,
                        color: documentColor,
                      }}
                    >
                      <td
                        style={{
                          padding: "8px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        TOTAL DUE:
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          textAlign: "right",
                        }}
                      >
                        R{formatMoney(finalTotal)}
                      </td>
                    </tr>
                  </table>
                </Column>
              </Row>
            </Section>
          )}

          {/* --- TOTAL WEIGHT SECTION --- */}
          {config.showTotalWeight && totalWeight > 0 && (
            <Section style={{ marginTop: "20px" }}>
              <Row>
                <Column style={{ width: "60%" }} />
                <Column style={{ width: "40%" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      borderTop: `2px solid ${documentColor}`,
                    }}
                  >
                    <tr>
                      <td
                        style={{
                          padding: "8px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      >
                        TOTAL WEIGHT:
                      </td>
                      <td
                        style={{
                          padding: "8px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          textAlign: "right",
                          color: documentColor,
                        }}
                      >
                        {totalWeight.toFixed(3)} kg
                      </td>
                    </tr>
                  </table>
                </Column>
              </Row>
            </Section>
          )}

          {/* --- TERMS & NOTES --- */}
          <Section style={{ marginTop: "30px" }}>
            {config.showPaymentTerms && document.paymentTerms && (
              <>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: "11px",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                    color: headerGreenText,
                  }}
                >
                  PAYMENT TERMS
                </Text>
                <div
                  dangerouslySetInnerHTML={{ __html: document.paymentTerms }}
                />
              </>
            )}

            {document.notes && (
              <>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: "11px",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                    color: headerGreenText,
                    marginTop: document.paymentTerms ? "15px" : "0",
                  }}
                >
                  NOTES
                </Text>
                <div dangerouslySetInnerHTML={{ __html: document.notes }} />
              </>
            )}

            {document.terms && (
              <>
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: "11px",
                    marginBottom: "5px",
                    textTransform: "uppercase",
                    color: headerGreenText,
                    marginTop:
                      document.notes || document.paymentTerms ? "15px" : "0",
                  }}
                >
                  TERMS & CONDITIONS
                </Text>
                <div dangerouslySetInnerHTML={{ __html: document.terms }} />
              </>
            )}

            {!document.notes &&
              !document.terms &&
              !document.paymentTerms &&
              !isSupplierList && (
                <Text style={{ fontSize: "10px", color: "#555" }}>
                  Thank you for your business.
                </Text>
              )}
          </Section>

          {/* --- BANK FOOTER --- */}
          {(cBankName || cBankName2) && (
            <Section
              style={{
                marginTop: "40px",
                borderTop: "1px solid #eee",
                padding: "10px 5px",
                textAlign: "center",
              }}
            >
              <Text
                style={{
                  fontSize: "9px",
                  fontWeight: "bold",
                  color: "#555",
                  margin: "0 0 5px 0",
                }}
              >
                Account holder: {cName}
              </Text>
              <Text style={{ fontSize: "9px", margin: "0", color: "#555" }}>
                {cBankName && (
                  <>
                    <strong>{cBankName}:</strong> {cBankAccount}
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                  </>
                )}
                {cBankName2 && (
                  <>
                    <strong>{cBankName2}:</strong> {cBankAccount2}
                  </>
                )}
              </Text>
            </Section>
          )}
        </Container>
      </Body>
    </Html>
  );
}
