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
import { InvoiceProps } from "@/types/invoice";

interface InvoiceEmailProps {
  invoice: InvoiceProps;
}

export function InvoiceEmail({ invoice }: InvoiceEmailProps) {
  // --- BRAND COLORS ---
  const colorRed = "#990000";
  const colorGold = "#C5A005";
  const colorBlack = "#000000";
  const headerGreenBg = "#D1FAE5";
  const headerGreenText = "#065F46";
  const borderGray = "#E5E7EB";

  // --- DATA ---
  const company = invoice.creator.GeneralSetting[0];
  const issueDate = new Date(invoice.issueDate).toLocaleDateString("en-GB");
  const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-GB");

  // --- CALCULATIONS ---
  const formatMoney = (amount: number) =>
    amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

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
  invoice.items.forEach((item) => {
    const qty = Number(item.quantity);
    const price = Number(item.unitPrice);
    const taxRate = Number(item.taxRate || 15);
    const linePrice = qty * price;

    let discountVal = 0;
    const discountInput = Number(item.itemDiscountAmount || 0);

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
        <td className="table-cell text-center"></td>
        <td className="table-cell">{item.description}</td>
        <td className="table-cell text-center">{item.qty}</td>
        <td className="table-cell text-right">R{formatMoney(item.price)}</td>
        <td className="table-cell text-center">{item.discountInput}</td>
        <td className="table-cell text-right">R{formatMoney(item.vat)}</td>
        <td className="table-cell text-right">R{formatMoney(item.total)}</td>
      </tr>
    );
  });

  // Add combined services row if exists
  if (combinedServicesData) {
    tableRows.push(
      <tr key="combined-services" style={{ backgroundColor: "#f8fafc" }}>
        <td className="table-cell text-center">SVC</td>
        <td className="table-cell">
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
        <td className="table-cell text-center">
          {combinedServicesData.quantity}
        </td>
        <td className="table-cell text-right">-</td>
        <td className="table-cell text-center">
          {combinedServicesData.discountInput}
        </td>
        <td className="table-cell text-right">
          R{formatMoney(combinedServicesData.vat)}
        </td>
        <td className="table-cell text-right" style={{ fontWeight: "bold" }}>
          R{formatMoney(combinedServicesData.total)}
        </td>
      </tr>
    );
  } else if (serviceItems.length > 0) {
    // Show services individually if not combined
    serviceItems.forEach((item, index) => {
      tableRows.push(
        <tr key={`service-${index}`}>
          <td className="table-cell text-center">SVC</td>
          <td className="table-cell">{item.description}</td>
          <td className="table-cell text-center">{item.qty}</td>
          <td className="table-cell text-right">R{formatMoney(item.price)}</td>
          <td className="table-cell text-center">{item.discountInput}</td>
          <td className="table-cell text-right">R{formatMoney(item.vat)}</td>
          <td className="table-cell text-right">R{formatMoney(item.total)}</td>
        </tr>
      );
    });
  }

  // Global Discount
  let globalDiscVal = 0;
  const globalDiscInput = Number(invoice.discountAmount || 0);
  if (invoice.discountType === "PERCENTAGE") {
    globalDiscVal = subtotalGross * (globalDiscInput / 100);
  } else if (invoice.discountType === "AMOUNT") {
    globalDiscVal = globalDiscInput;
  }

  // Final Totals
  const finalSubtotalNet = subtotalGross - globalDiscVal;
  const finalTax = Number(invoice.taxAmount);
  const finalTotal = Number(invoice.totalAmount);

  // Payment status
  const totalPaid =
    (invoice.payments || []).reduce((acc, p) => acc + Number(p.amount), 0) +
    Number(invoice.depositAmount || 0);
  const balanceDue = finalTotal - totalPaid;

  return (
    <Html>
      <Head>
        <style>{`
          body { font-family: Arial, sans-serif; }
          .table-header { background-color: ${headerGreenBg}; color: ${headerGreenText}; font-weight: bold; text-align: center; font-size: 10px; padding: 8px 4px; }
          .table-cell { border-bottom: 1px solid #f0f0f0; padding: 8px 4px; font-size: 11px; vertical-align: top; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
        `}</style>
      </Head>
      <Preview>
        Invoice {invoice.invoiceNumber} from {company?.companyName!}
      </Preview>
      <Body
        style={{ backgroundColor: "#ffffff", margin: "0", padding: "20px" }}
      >
        <Container style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* --- HEADER SECTION --- */}
          <Section style={{ marginBottom: "30px" }}>
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

                <Text
                  style={{
                    fontSize: "11px",
                    lineHeight: "1.4",
                    margin: "0",
                    color: "#000",
                  }}
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
                    marginTop: "10px",
                    color: "#000",
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
                    marginTop: "10px",
                    color: "#000",
                  }}
                >
                  {company?.phone}
                  <br />
                  {company?.phone2}
                  <br />
                  {company?.email}
                </Text>
              </Column>

              {/* RIGHT: Invoice Details & Client */}
              <Column style={{ width: "40%", verticalAlign: "top" }}>
                <Text
                  style={{
                    fontSize: "24px",
                    color: colorRed,
                    fontWeight: "bold",
                    textAlign: "right",
                    margin: "0 0 15px 0",
                    textDecoration: "underline",
                  }}
                >
                  INVOICE
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
                      Invoice No.:
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
                      {invoice.invoiceNumber}
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
                </table>

                <Text
                  style={{
                    fontSize: "11px",
                    fontWeight: "bold",
                    margin: "0 0 2px 0",
                    color: "#555",
                  }}
                >
                  BILL TO
                </Text>
                <div
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    backgroundColor: "#fdfdfd",
                  }}
                >
                  <Text
                    style={{
                      fontSize: "12px",
                      fontWeight: "bold",
                      margin: "0 0 5px 0",
                    }}
                  >
                    {invoice.client.name}
                  </Text>
                  <Text
                    style={{ fontSize: "11px", margin: "0", lineHeight: "1.3" }}
                  >
                    {invoice.client.company}
                    <br />
                    {invoice.client.address}
                    <br />
                    {invoice.client.phone}
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* --- ITEMS TABLE --- */}
          <Section>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th className="table-header" style={{ width: "10%" }}>
                    CODE
                  </th>
                  <th
                    className="table-header"
                    style={{ width: "35%", textAlign: "left" }}
                  >
                    DESCRIPTION
                  </th>
                  <th className="table-header" style={{ width: "10%" }}>
                    QTY
                  </th>
                  <th
                    className="table-header"
                    style={{ width: "15%", textAlign: "right" }}
                  >
                    PRICE
                  </th>
                  <th className="table-header" style={{ width: "10%" }}>
                    DISC
                  </th>
                  <th
                    className="table-header"
                    style={{ width: "10%", textAlign: "right" }}
                  >
                    VAT
                  </th>
                  <th
                    className="table-header"
                    style={{ width: "10%", textAlign: "right" }}
                  >
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>{tableRows}</tbody>
            </table>
          </Section>

          {/* --- TOTALS SECTION --- */}
          <Section style={{ marginTop: "20px" }}>
            <Row>
              <Column style={{ width: "60%" }} />
              <Column style={{ width: "40%" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  {totalItemDiscount > 0 && (
                    <tr>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        ITEM DISCOUNTS:
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          textAlign: "right",
                        }}
                      >
                        R{formatMoney(totalItemDiscount)}
                      </td>
                    </tr>
                  )}
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
                  {globalDiscVal > 0 && (
                    <tr>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                        }}
                      >
                        DISCOUNT:
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          textAlign: "right",
                        }}
                      >
                        R{formatMoney(globalDiscVal)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td
                      style={{
                        padding: "6px 8px",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      VAT:
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        fontSize: "11px",
                        fontWeight: "bold",
                        textAlign: "right",
                      }}
                    >
                      R{formatMoney(finalTax)}
                    </td>
                  </tr>
                  <tr
                    style={{
                      borderTop: `2px solid ${headerGreenText}`,
                      color: headerGreenText,
                    }}
                  >
                    <td
                      style={{
                        padding: "8px",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      TOTAL:
                    </td>
                    <td
                      style={{
                        padding: "8px",
                        fontSize: "14px",
                        fontWeight: "bold",
                        textAlign: "right",
                      }}
                    >
                      R{formatMoney(finalTotal)}
                    </td>
                  </tr>
                  {totalPaid > 0 && (
                    <tr>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          color: colorGold,
                        }}
                      >
                        PAID:
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          textAlign: "right",
                          color: colorGold,
                        }}
                      >
                        R{formatMoney(totalPaid)}
                      </td>
                    </tr>
                  )}
                  {totalPaid > 0 && (
                    <tr>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          color: colorRed,
                        }}
                      >
                        DUE:
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          fontSize: "11px",
                          fontWeight: "bold",
                          textAlign: "right",
                          color: colorRed,
                        }}
                      >
                        R{formatMoney(balanceDue)}
                      </td>
                    </tr>
                  )}
                </table>
              </Column>
            </Row>
          </Section>

          {/* --- TERMS & CONDITIONS (HTML RENDERED) --- */}
          <Section style={{ marginTop: "20px" }}>
            {/* Notes Section */}
            {invoice.paymentTerms && (
              <div
                className="rich-text"
                style={{ fontSize: "10px", marginBottom: "15px" }}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: invoice.paymentTerms }}
                />
              </div>
            )}

            {/* Terms Section */}
            {invoice.notes && (
              <div className="rich-text" style={{ fontSize: "10px" }}>
                <div dangerouslySetInnerHTML={{ __html: invoice.notes }} />
              </div>
            )}

            {/* Fallback if no formatted text provided */}
            {!invoice.notes && !invoice.terms && (
              <Text style={{ fontSize: "10px", color: "#555" }}>
                Standard terms and conditions apply. Warranty for repairs only.
              </Text>
            )}
          </Section>

          {/* --- BANK FOOTER STRIP --- */}
          <Section
            style={{
              marginTop: "40px",
              borderTop: "1px solid #eee",
              padding: "15px",
              backgroundColor: "#f9f9f9",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                fontSize: "10px",
                fontWeight: "bold",
                color: "#555",
                margin: "0 0 5px 0",
              }}
            >
              Account holder:{" "}
              {company?.companyName || "NDOU ELECTRICAL CONSTRUCTION"}
            </Text>
            <Text style={{ fontSize: "10px", margin: "0", color: "#555" }}>
              <strong>{company?.bankName || "FNB/RMB"}:</strong>{" "}
              {company?.bankAccount || "62884849351"}
              &nbsp;&nbsp;|&nbsp;&nbsp;
              <strong>{company?.bankName2 || "CAPITEC"}:</strong>{" "}
              {company?.bankAccount2 || "1052413331"}
            </Text>
          </Section>

          {/* --- VIEW ONLINE LINK --- */}
          <Section style={{ textAlign: "center", marginTop: "20px" }}>
            {/*   <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/invoices/${invoice.id}/view`}
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
              View Invoice Online
            </Link> */}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
