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
import { QuotationWithRelations } from "@/types/quotation";

interface QuotationEmailProps {
  quotation: QuotationWithRelations;
}

export function QuotationEmail({ quotation }: QuotationEmailProps) {
  // --- BRAND COLORS ---
  const colorRed = "#990000";
  const colorGold = "#C5A005";
  const headerGreenBg = "#D1FAE5";
  const headerGreenText = "#065F46";
  const colorText = "#000000";

  // --- DATA ---
  const settingsArray = quotation.creator?.GeneralSetting;
  const company = Array.isArray(settingsArray)
    ? settingsArray[0]
    : settingsArray;

  const issueDate = new Date(quotation.issueDate).toLocaleDateString("en-GB");
  const validUntil = new Date(quotation.validUntil).toLocaleDateString("en-GB");

  // --- HELPERS ---
  const formatMoney = (amount: number) =>
    amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const safeNumber = (val: any) => {
    if (!val) return 0;
    return Number(val);
  };

  // --- CALCULATIONS ---
  let subtotalGross = 0;
  let totalItemDiscount = 0;

  // --- SEPARATE ITEMS INTO PRODUCTS AND SERVICES ---
  const productItems: Array<{
    description: string;
    qty: number;
    price: number;
    linePrice: number;
    discountInput: string;
    vat: number;
    total: number;
  }> = [];

  const serviceItems: Array<{
    description: string;
    qty: number;
    price: number;
    linePrice: number;
    discountInput: string;
    vat: number;
    total: number;
  }> = [];

  // Process all items
  quotation.items.forEach((item) => {
    const qty = safeNumber(item.quantity);
    const price = safeNumber(item.unitPrice);
    const taxRate = safeNumber(item.taxRate || 15);
    const linePrice = qty * price;

    let discountVal = 0;
    const discountInput = safeNumber(item.itemDiscountAmount);

    if (item.itemDiscountType === "PERCENTAGE") {
      discountVal = linePrice * (discountInput / 100);
    } else if (item.itemDiscountType === "AMOUNT") {
      discountVal = discountInput;
    }

    discountVal = Math.min(discountVal, linePrice);
    const net = linePrice - discountVal;
    const taxVal = net * (taxRate / 100);
    const totalLine = net + taxVal;

    subtotalGross += net;
    totalItemDiscount += discountVal;

    const itemData = {
      description: item.description,
      qty,
      price,
      linePrice,
      discountInput:
        item.itemDiscountType === "PERCENTAGE" ? `${discountInput}%` : "-",
      vat: taxVal,
      total: totalLine,
    };

    // Determine if item is product or service
    if (item.shopProductId) {
      productItems.push(itemData);
    } else if (item.serviceId) {
      serviceItems.push(itemData);
    } else {
      const descLower = item.description?.toLowerCase() || "";
      if (
        descLower.includes("service") ||
        descLower.includes("labour") ||
        descLower.includes("install")
      ) {
        serviceItems.push(itemData);
      } else {
        productItems.push(itemData);
      }
    }
  });

  // --- CREATE COMBINED SERVICES DATA ---
  let combinedServicesData: {
    description: string;
    quantity: number;
    linePrice: number;
    discountInput: string;
    vat: number;
    total: number;
    individualServices: Array<{
      description: string;
      qty: number;
      price: number;
      linePrice: number;
      discountInput: string;
      vat: number;
      total: number;
    }>;
  } | null = null;

  if (serviceItems.length > 0) {
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
      totalDiscount +=
        service.discountInput !== "-" && service.discountInput !== "0%"
          ? (service.linePrice * parseFloat(service.discountInput)) / 100
          : 0;
      totalNet += service.total - service.vat;
      totalVatServices += service.vat;
      totalAmountServices += service.total;

      if (service.description) {
        serviceDescriptions.push(service.description);
      }
    });

    const combinedDiscountPercent =
      totalLinePrice > 0
        ? ((totalDiscount / totalLinePrice) * 100).toFixed(1)
        : "0.0";

    combinedServicesData = {
      description: `Services Package (${serviceItems.length} services)`,
      quantity: totalQuantity,
      linePrice: totalLinePrice,
      discountInput: serviceItems.some((s) => s.discountInput !== "-")
        ? `${combinedDiscountPercent}%`
        : "-",
      vat: totalVatServices,
      total: totalAmountServices,
      individualServices: serviceItems,
    };
  }

  // --- BUILD TABLE ROWS ---
  const tableRows: JSX.Element[] = [];

  // Add product rows
  productItems.forEach((item, index) => {
    tableRows.push(
      <tr key={`product-${index}`}>
        <td style={{ textAlign: "center" }}></td>
        <td>{item.description}</td>
        <td style={{ textAlign: "center" }}>{item.qty}</td>
        <td style={{ textAlign: "right" }}>R{formatMoney(item.price)}</td>
        <td style={{ textAlign: "center" }}>{item.discountInput}</td>
        <td style={{ textAlign: "right" }}>R{formatMoney(item.vat)}</td>
        <td style={{ textAlign: "right" }}>R{formatMoney(item.total)}</td>
      </tr>
    );
  });

  // Add combined services row if exists
  if (combinedServicesData) {
    tableRows.push(
      <tr key="combined-services" style={{ backgroundColor: "#f8fafc" }}>
        <td style={{ textAlign: "center", fontWeight: "bold" }}>SVC</td>
        <td>
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
        <td style={{ textAlign: "center" }}>{combinedServicesData.quantity}</td>
        <td style={{ textAlign: "right", fontStyle: "italic" }}>-</td>
        <td style={{ textAlign: "center" }}>
          {combinedServicesData.discountInput}
        </td>
        <td style={{ textAlign: "right" }}>
          R{formatMoney(combinedServicesData.vat)}
        </td>
        <td style={{ textAlign: "right", fontWeight: "bold" }}>
          R{formatMoney(combinedServicesData.total)}
        </td>
      </tr>
    );
  } else if (serviceItems.length > 0) {
    // Show services individually if not combined
    serviceItems.forEach((item, index) => {
      tableRows.push(
        <tr key={`service-${index}`}>
          <td style={{ textAlign: "center", fontWeight: "bold" }}>SVC</td>
          <td>{item.description}</td>
          <td style={{ textAlign: "center" }}>{item.qty}</td>
          <td style={{ textAlign: "right" }}>R{formatMoney(item.price)}</td>
          <td style={{ textAlign: "center" }}>{item.discountInput}</td>
          <td style={{ textAlign: "right" }}>R{formatMoney(item.vat)}</td>
          <td style={{ textAlign: "right" }}>R{formatMoney(item.total)}</td>
        </tr>
      );
    });
  }

  // Global Discount
  let globalDiscVal = 0;
  const globalDiscInput = safeNumber(quotation.discountAmount);
  if (quotation.discountType === "PERCENTAGE") {
    globalDiscVal = subtotalGross * (globalDiscInput / 100);
  } else if (quotation.discountType === "AMOUNT") {
    globalDiscVal = globalDiscInput;
  }

  const finalSubtotalNet = subtotalGross - globalDiscVal;
  const finalTax = safeNumber(quotation.taxAmount);
  const finalTotal = safeNumber(quotation.totalAmount);
  const depositAmount = safeNumber(quotation.depositAmount);

  return (
    <Html>
      <Head>
        <style>{`
          body { font-family: Arial, sans-serif; color: ${colorText}; }
          .header-gold { color: ${colorGold}; font-weight: bold; font-size: 20px; }
          .header-red { color: ${colorRed}; font-weight: bold; font-size: 20px; }
          
          /* TABLE STYLES - REMOVED BORDERS */
          .details-table td { border: none; padding: 4px; font-size: 11px; font-weight: bold; }
          
          .items-table th { 
            background-color: ${headerGreenBg}; 
            color: ${headerGreenText}; 
            padding: 6px; 
            font-size: 10px; 
            font-weight: bold; 
            border: none; /* Removed border */
            text-align: center;
          }
          
          .items-table td { 
            border: none; /* Removed border */
            border-bottom: 1px solid #f5f5f5; /* Very subtle divider */
            padding: 6px; 
            font-size: 10px; 
          }
          
          .totals-table td { border: none; padding: 6px; font-size: 11px; font-weight: bold; }
          
          /* HTML CONTENT STYLES */
          .rich-text p { margin: 0 0 8px 0; }
          .rich-text ul { margin: 0 0 8px 0; padding-left: 20px; }
          .rich-text li { margin-bottom: 4px; }
          .rich-text h2 { font-size: 14px; margin: 10px 0 5px 0; text-transform: uppercase; color: ${headerGreenText}; }
          .rich-text strong { font-weight: bold; }
        `}</style>
      </Head>
      <Preview>
        Quotation #{quotation.quotationNumber} from {company?.companyName!}
      </Preview>
      <Body style={{ backgroundColor: "#ffffff", padding: "20px" }}>
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
                {company?.logo && (
                  <Img
                    src={company.logo}
                    width="150"
                    alt="Logo"
                    style={{ marginBottom: "10px", objectFit: "contain" }}
                  />
                )}
                {!company?.logo && (
                  <Text style={{ margin: "0 0 5px 0" }}>
                    <span className="header-gold">MINECS</span>{" "}
                    <span className="header-red">ENGINEERS</span>
                  </Text>
                )}

                <Text
                  style={{ fontSize: "11px", lineHeight: "1.4", margin: "0" }}
                >
                  <strong>{company?.companyName}</strong>
                  <br />
                  {company?.Address}
                  <br />
                  {company?.city} {company?.postCode}
                  <br />
                  {company?.province}
                </Text>

                <Text
                  style={{
                    fontSize: "11px",
                    lineHeight: "1.4",
                    margin: "10px 0 0 0",
                  }}
                >
                  <strong>Reg No.:</strong> 2020/472506/07
                  <br />
                  <strong>VAT No.:</strong> {company?.taxId}
                </Text>

                <Text
                  style={{
                    fontSize: "11px",
                    lineHeight: "1.4",
                    margin: "10px 0 0 0",
                  }}
                >
                  {company?.phone}
                  <br />
                  {company?.phone2}
                  <br />
                  <Link
                    href={`mailto:${company?.email}`}
                    style={{ color: "#000", textDecoration: "none" }}
                  >
                    {company?.email}
                  </Link>
                </Text>
              </Column>

              {/* RIGHT: Quote Details */}
              <Column style={{ width: "40%", verticalAlign: "top" }}>
                <Text
                  style={{
                    fontSize: "22px",
                    color: colorRed,
                    fontWeight: "bold",
                    textAlign: "right",
                    margin: "0 0 10px 0",
                    textDecoration: "underline",
                  }}
                >
                  QUOTATION
                </Text>

                {/* Details Table */}
                <Section style={{ marginBottom: "15px" }}>
                  <table
                    style={{ width: "100%", borderCollapse: "collapse" }}
                    className="details-table"
                  >
                    <tr>
                      <td style={{ width: "40%" }}>Quote No.:</td>
                      <td style={{ width: "60%", textAlign: "right" }}>
                        {quotation.quotationNumber}
                      </td>
                    </tr>
                    <tr>
                      <td>Date:</td>
                      <td style={{ textAlign: "right" }}>{issueDate}</td>
                    </tr>
                    <tr>
                      <td>Valid Until:</td>
                      <td style={{ textAlign: "right" }}>{validUntil}</td>
                    </tr>
                  </table>
                </Section>

                <Text
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    margin: "0 0 2px 0",
                  }}
                >
                  FOR
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
                    {quotation.client.name}
                  </Text>
                  <Text
                    style={{ fontSize: "11px", margin: "0", lineHeight: "1.3" }}
                  >
                    {quotation.client.company}
                    <br />
                    {quotation.client.address}
                    <br />
                    {quotation.client.town}
                    <br />
                    {quotation.client.village}
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* --- ITEMS TABLE --- */}
          <Section>
            <table
              style={{ width: "100%", borderCollapse: "collapse" }}
              className="items-table"
            >
              <thead>
                <tr>
                  <th style={{ width: "10%" }}>CODE</th>
                  <th style={{ width: "35%", textAlign: "left" }}>
                    DESCRIPTION
                  </th>
                  <th style={{ width: "10%" }}>QTY</th>
                  <th style={{ width: "15%", textAlign: "right" }}>PRICE</th>
                  <th style={{ width: "10%" }}>DISC</th>
                  <th style={{ width: "10%", textAlign: "right" }}>VAT</th>
                  <th style={{ width: "10%", textAlign: "right" }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>{tableRows}</tbody>
            </table>
          </Section>

          {/* --- TOTALS SECTION --- */}
          <Section style={{ marginTop: "15px" }}>
            <Row>
              <Column style={{ width: "60%" }} />
              <Column style={{ width: "40%" }}>
                <table
                  style={{ width: "100%", borderCollapse: "collapse" }}
                  className="totals-table"
                >
                  {totalItemDiscount > 0 && (
                    <tr>
                      <td>ITEM DISCOUNTS:</td>
                      <td style={{ textAlign: "right" }}>
                        R{formatMoney(totalItemDiscount)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td>SUBTOTAL:</td>
                    <td style={{ textAlign: "right" }}>
                      R{formatMoney(subtotalGross)}
                    </td>
                  </tr>
                  {globalDiscVal > 0 && (
                    <tr>
                      <td>DISCOUNT:</td>
                      <td style={{ textAlign: "right" }}>
                        R{formatMoney(globalDiscVal)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td>VAT 15%:</td>
                    <td style={{ textAlign: "right" }}>
                      R{formatMoney(finalTax)}
                    </td>
                  </tr>
                  <tr style={{ color: headerGreenText }}>
                    <td>TOTAL (ZAR):</td>
                    <td style={{ textAlign: "right" }}>
                      R{formatMoney(finalTotal)}
                    </td>
                  </tr>
                  {quotation.depositRequired && (
                    <tr>
                      <td style={{ color: colorRed }}>DEPOSIT REQ:</td>
                      <td style={{ textAlign: "right", color: colorRed }}>
                        R{formatMoney(depositAmount)}
                      </td>
                    </tr>
                  )}
                </table>
              </Column>
            </Row>
          </Section>

          {/* --- TERMS & CONDITIONS (HTML RENDERED) --- */}
          <Section style={{ marginTop: "20px" }}>
            {/* Terms Section */}
            {quotation.paymentTerms && (
              <div className="rich-text" style={{ fontSize: "10px" }}>
                <div
                  dangerouslySetInnerHTML={{ __html: quotation.paymentTerms }}
                />
              </div>
            )}
            {/* Notes Section */}
            {quotation.notes && (
              <div
                className="rich-text"
                style={{ fontSize: "10px", marginBottom: "15px" }}
              >
                <div dangerouslySetInnerHTML={{ __html: quotation.notes }} />
              </div>
            )}

            {/* Fallback if no formatted text provided */}
            {!quotation.notes && !quotation.terms && (
              <Text style={{ fontSize: "10px", color: "#555" }}>
                Standard terms and conditions apply. Warranty for repairs only.
              </Text>
            )}
          </Section>

          {/* --- VIEW LINK --- */}
          <Section
            style={{
              textAlign: "center",
              marginTop: "30px",
              marginBottom: "20px",
            }}
          >
            {/*    <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/quotations/${quotation.id}/view`}
              style={{
                backgroundColor: colorRed,
                color: "#ffffff",
                padding: "10px 20px",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "12px",
                borderRadius: "4px",
              }}
            >
              View Quotation Online
            </Link> */}
          </Section>

          {/* --- BANK STRIP --- */}
          <Section
            style={{
              borderTop: `2px solid ${colorRed}`,
              borderBottom: `2px solid ${colorRed}`,
              padding: "10px",
              backgroundColor: "#f9f9f9",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                fontSize: "10px",
                fontWeight: "bold",
                margin: "0 0 5px 0",
              }}
            >
              Account holder:{" "}
              {company?.companyName || "NDOU ELECTRICAL CONSTRUCTION"}
            </Text>
            <Text style={{ fontSize: "10px", margin: "0" }}>
              <strong>{company?.bankName || "FNB/RMB"}:</strong>{" "}
              {company?.bankAccount || "62884849351"}
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <strong>{company?.bankName2 || "CAPITEC"}:</strong>{" "}
              {company?.bankAccount2 || "1052413331"}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
