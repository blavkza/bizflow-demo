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
  Hr,
  Heading,
} from "@react-email/components";
import { QuotationWithRelations } from "@/types/quotation";

interface QuotationEmailProps {
  quotation: QuotationWithRelations;
}

export function QuotationEmail({ quotation }: QuotationEmailProps) {
  const primaryColor = "#1F2937";
  const secondaryColor = "#F3F4F6";
  const accentColor = "#3B82F6";

  // Helper function to safely convert Decimal to number
  const decimalToNumber = (decimalValue: any): number => {
    if (decimalValue === null || decimalValue === undefined) return 0;
    if (typeof decimalValue === "number") return decimalValue;
    if (typeof decimalValue === "string") return parseFloat(decimalValue) || 0;
    // Handle Prisma Decimal type
    if (decimalValue && typeof decimalValue === "object") {
      return parseFloat(decimalValue.toString()) || 0;
    }
    return 0;
  };

  // Calculate amounts safely
  const subtotal = quotation.items.reduce(
    (sum, item) =>
      sum + decimalToNumber(item.quantity) * decimalToNumber(item.unitPrice),
    0
  );
  const taxAmount = decimalToNumber(quotation.taxAmount);
  const discount = decimalToNumber(quotation.discountAmount);
  const total = subtotal + taxAmount - discount;

  const creatorSettings = quotation.creator?.GeneralSetting?.[0] || {};

  // Calculate days until expiry
  const validUntil = new Date(quotation.validUntil);
  const today = new Date();
  const daysUntilExpiry = Math.ceil(
    (validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return `R${amount.toFixed(2)}`;
  };

  return (
    <Html>
      <Head>
        <title>Quotation #{quotation.quotationNumber}</title>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: ${primaryColor};
              font-size: 12px;
              margin: 0;
              padding: 0;
              background-color: #ffffff;
            }
            .watermark {
              position: absolute;
              inset: 0;
              opacity: 0.05;
              z-index: 0;
              pointer-events: none;
              background-repeat: no-repeat;
              background-position: center;
              background-size: 50%;
              filter: grayscale(100%);
              transform: rotate(-10deg);
            }
            .status-badge {
              display: inline-block;
              padding: 0.25rem 0.5rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 600;
            }
            .compact-table {
              width: 100%;
              border-collapse: collapse;
              border: 1px solid #E5E7EB;
              border-radius: 0.25rem;
              overflow: hidden;
            }
            .compact-table td, .compact-table th {
              padding: 0.5rem !important;
              border-bottom: 1px solid #E5E7EB;
            }
            .compact-table th {
              background-color: ${secondaryColor};
              font-weight: 600;
              text-align: left;
            }
            .compact-table tr:last-child td {
              border-bottom: none;
            }
            @media (max-width: 600px) {
              .mobile-column {
                width: 100% !important;
                display: block !important;
              }
            }
          `}</style>
      </Head>
      <Body
        style={{
          backgroundColor: "#ffffff",
          position: "relative",
          margin: 0,
          padding: 0,
        }}
      >
        {creatorSettings.logo && (
          <div
            className="watermark"
            style={{ backgroundImage: `url(${creatorSettings.logo})` }}
          />
        )}

        <Container
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "1.5rem",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Header */}
          <Section style={{ marginBottom: "1.5rem" }}>
            <Row>
              <Column style={{ width: "60%" }} className="mobile-column">
                {creatorSettings.logo && (
                  <Img
                    src={creatorSettings.logo}
                    alt="Company Logo"
                    style={{
                      height: "60px",
                      marginBottom: "0.5rem",
                      objectFit: "contain",
                    }}
                  />
                )}
                <Text
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: "0.25rem",
                    color: "#374151",
                    lineHeight: "1.2",
                  }}
                >
                  {creatorSettings.companyName || "Your Company"}
                </Text>
                <Text
                  style={{
                    color: "#4B5563",
                    lineHeight: "1.4",
                    fontSize: "11px",
                  }}
                >
                  {creatorSettings.Address && (
                    <>
                      {creatorSettings.Address}
                      <br />
                    </>
                  )}
                  {creatorSettings.city && creatorSettings.province && (
                    <>
                      {creatorSettings.city}, {creatorSettings.province}{" "}
                      {creatorSettings.postCode}
                      <br />
                    </>
                  )}
                  {creatorSettings.email && (
                    <>
                      {creatorSettings.email}
                      <br />
                    </>
                  )}
                  {[
                    creatorSettings.phone,
                    creatorSettings.phone2,
                    creatorSettings.phone3,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                  {creatorSettings.taxId && (
                    <>
                      <br />
                      VAT Number: {creatorSettings.taxId}
                    </>
                  )}
                </Text>
              </Column>
              <Column
                style={{ width: "40%", textAlign: "right" }}
                className="mobile-column"
              >
                <Heading
                  style={{
                    fontSize: "1.5rem",
                    color: accentColor,
                    marginBottom: "0.5rem",
                    fontWeight: "bold",
                  }}
                >
                  QUOTATION
                </Heading>
                <div
                  style={{
                    backgroundColor: secondaryColor,
                    padding: "0.75rem",
                    borderRadius: "0.375rem",
                    display: "inline-block",
                    textAlign: "left",
                    border: "1px solid #E5E7EB",
                  }}
                >
                  <Text style={{ fontWeight: 700, margin: "0 0 0.25rem 0" }}>
                    #{quotation.quotationNumber}
                  </Text>
                  <Text style={{ margin: "0.125rem 0", fontSize: "11px" }}>
                    <strong>Issued:</strong>{" "}
                    {new Date(quotation.issueDate).toLocaleDateString()}
                  </Text>
                  <Text style={{ margin: "0.125rem 0", fontSize: "11px" }}>
                    <strong>Valid Until:</strong>{" "}
                    {new Date(quotation.validUntil).toLocaleDateString()}
                    {daysUntilExpiry <= 7 && (
                      <span
                        style={{
                          color: daysUntilExpiry <= 0 ? "#DC2626" : "#D97706",
                          fontWeight: "600",
                          marginLeft: "0.25rem",
                        }}
                      >
                        (
                        {daysUntilExpiry <= 0
                          ? "EXPIRED"
                          : `${daysUntilExpiry} days left`}
                        )
                      </span>
                    )}
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* Client Info + Status */}
          <Section style={{ marginBottom: "1.5rem" }}>
            <Row>
              <Column
                style={{
                  width: "50%",
                  backgroundColor: secondaryColor,
                  padding: "1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #E5E7EB",
                }}
                className="mobile-column"
              >
                <Text
                  style={{
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                    color: "#374151",
                    fontSize: "11px",
                    textTransform: "uppercase",
                  }}
                >
                  QUOTATION FOR
                </Text>
                {quotation.client.company && (
                  <Text style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                    {quotation.client.company}
                  </Text>
                )}
                <Text style={{ fontWeight: 600, marginBottom: "0.25rem" }}>
                  {quotation.client.name}
                </Text>
                <Text
                  style={{
                    color: "#4B5563",
                    fontSize: "11px",
                    margin: "0.125rem 0",
                  }}
                >
                  {quotation.client.email}
                </Text>
                <Text
                  style={{
                    color: "#4B5563",
                    fontSize: "11px",
                    margin: "0.125rem 0",
                  }}
                >
                  {quotation.client.phone}
                </Text>
                {quotation.client.taxNumber && (
                  <Text
                    style={{
                      color: "#4B5563",
                      fontSize: "11px",
                      margin: "0.125rem 0",
                    }}
                  >
                    VAT Number: {quotation.client.taxNumber}
                  </Text>
                )}
                {quotation.client.address && (
                  <Text
                    style={{
                      color: "#4B5563",
                      fontSize: "11px",
                      margin: "0.125rem 0",
                    }}
                  >
                    {quotation.client.address}
                  </Text>
                )}
              </Column>
              <Column
                style={{
                  width: "50%",
                  backgroundColor: secondaryColor,
                  padding: "1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #E5E7EB",
                }}
                className="mobile-column"
              >
                <Text
                  style={{
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                    color: "#374151",
                    fontSize: "11px",
                    textTransform: "uppercase",
                  }}
                >
                  STATUS
                </Text>
                <span
                  className="status-badge"
                  style={{
                    backgroundColor:
                      quotation.status === "ACCEPTED"
                        ? "#D1FAE5"
                        : quotation.status === "EXPIRED" ||
                            quotation.status === "CANCELLED"
                          ? "#FEE2E2"
                          : quotation.status === "CONVERTED"
                            ? "#DBEAFE"
                            : "#FEF3C7",
                    color:
                      quotation.status === "ACCEPTED"
                        ? "#065F46"
                        : quotation.status === "EXPIRED" ||
                            quotation.status === "CANCELLED"
                          ? "#B91C1C"
                          : quotation.status === "CONVERTED"
                            ? "#1E40AF"
                            : "#92400E",
                  }}
                >
                  {quotation.status}
                </span>

                {quotation.status === "CONVERTED" && quotation.invoiceId && (
                  <Text
                    style={{
                      fontSize: "11px",
                      color: "#4B5563",
                      marginTop: "0.5rem",
                    }}
                  >
                    Converted to Invoice #{quotation.invoiceId}
                  </Text>
                )}

                <div
                  style={{
                    marginTop: "1rem",
                    borderTop: "1px solid #E5E7EB",
                    paddingTop: "0.75rem",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: 700,
                      color: "#374151",
                      fontSize: "11px",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Payment Terms
                  </Text>
                  <Text
                    style={{
                      color: "#4B5563",
                      fontSize: "11px",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {quotation.paymentTerms || "Standard payment terms apply"}
                  </Text>

                  {(creatorSettings.bankName || creatorSettings.bankName2) && (
                    <>
                      <Text
                        style={{
                          fontWeight: 700,
                          color: "#374151",
                          fontSize: "11px",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Banking Details
                      </Text>
                      {creatorSettings.bankName &&
                        creatorSettings.bankAccount && (
                          <div style={{ marginBottom: "0.5rem" }}>
                            <Text style={{ fontWeight: 600, fontSize: "11px" }}>
                              {creatorSettings.bankName}
                            </Text>
                            <Text
                              style={{ fontSize: "11px", color: "#4B5563" }}
                            >
                              Account: {creatorSettings.bankAccount}
                            </Text>
                          </div>
                        )}
                      {creatorSettings.bankName2 &&
                        creatorSettings.bankAccount2 && (
                          <div>
                            <Text style={{ fontWeight: 600, fontSize: "11px" }}>
                              {creatorSettings.bankName2}
                            </Text>
                            <Text
                              style={{ fontSize: "11px", color: "#4B5563" }}
                            >
                              Account: {creatorSettings.bankAccount2}
                            </Text>
                          </div>
                        )}
                    </>
                  )}
                </div>
              </Column>
            </Row>
          </Section>

          {/* Items Table */}
          <Section style={{ marginBottom: "1.5rem" }}>
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Description</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Unit Price</th>
                  <th style={{ textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => {
                  const quantity = decimalToNumber(item.quantity);
                  const unitPrice = decimalToNumber(item.unitPrice);
                  const amount = quantity * unitPrice;

                  return (
                    <tr
                      key={index}
                      style={{
                        backgroundColor:
                          index % 2 === 0 ? "#FFFFFF" : "#F9FAFB",
                      }}
                    >
                      <td>{item.description}</td>
                      <td style={{ textAlign: "center" }}>
                        {quantity.toLocaleString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(unitPrice)}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {formatCurrency(amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>

          {/* Totals */}
          <Section style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "300px" }}>
                {/* Subtotal */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "0.25rem 0",
                    borderBottom: "1px solid #E5E7EB",
                  }}
                >
                  <Text style={{ fontWeight: 500 }}>Subtotal:</Text>
                  <Text style={{ fontWeight: 500 }}>
                    {formatCurrency(subtotal)}
                  </Text>
                </div>

                {/* Tax */}
                {taxAmount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.25rem 0",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    <Text>
                      Tax{" "}
                      {subtotal > 0
                        ? `(${((taxAmount / subtotal) * 100).toFixed(2)}%)`
                        : ""}
                      :
                    </Text>
                    <Text>{formatCurrency(taxAmount)}</Text>
                  </div>
                )}

                {/* Discount */}
                {discount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "0.25rem 0",
                      borderBottom: "1px solid #E5E7EB",
                    }}
                  >
                    <Text>Discount:</Text>
                    <Text>-{formatCurrency(discount)}</Text>
                  </div>
                )}

                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0",
                    borderTop: "2px solid #3B82F6",
                    marginTop: "0.25rem",
                  }}
                >
                  <Text>Total Amount:</Text>
                  <Text style={{ color: accentColor }}>
                    {formatCurrency(total)}
                  </Text>
                </div>
              </div>
            </div>
          </Section>

          {/* Notes & Terms */}
          {(quotation.notes || quotation.terms) && (
            <Section style={{ marginBottom: "1.5rem" }}>
              <div
                style={{
                  backgroundColor: secondaryColor,
                  padding: "1rem",
                  borderRadius: "0.375rem",
                  border: "1px solid #E5E7EB",
                }}
              >
                <Row>
                  {quotation.notes && (
                    <Column style={{ width: "50%" }} className="mobile-column">
                      <Text
                        style={{
                          fontWeight: 700,
                          marginBottom: "0.5rem",
                          fontSize: "11px",
                        }}
                      >
                        Notes
                      </Text>
                      <Text style={{ fontSize: "11px", lineHeight: "1.4" }}>
                        {quotation.notes}
                      </Text>
                    </Column>
                  )}
                  {quotation.terms && (
                    <Column style={{ width: "50%" }} className="mobile-column">
                      <Text
                        style={{
                          fontWeight: 700,
                          marginBottom: "0.5rem",
                          fontSize: "11px",
                        }}
                      >
                        Terms & Conditions
                      </Text>
                      <Text style={{ fontSize: "11px", lineHeight: "1.4" }}>
                        {quotation.terms}
                      </Text>
                    </Column>
                  )}
                </Row>
              </div>
            </Section>
          )}

          {/* Footer */}
          <Section>
            <Hr
              style={{
                borderColor: "#E5E7EB",
                marginTop: "1rem",
                marginBottom: "1rem",
              }}
            />
            <Text
              style={{
                color: "#9CA3AF",
                textAlign: "center",
                fontSize: "11px",
                margin: "0.25rem 0",
              }}
            >
              {creatorSettings.website && (
                <>
                  {creatorSettings.website}
                  <br />
                </>
              )}
              This quotation is valid until{" "}
              {new Date(quotation.validUntil).toLocaleDateString()}
              {daysUntilExpiry <= 0 && (
                <span style={{ color: "#DC2626", fontWeight: "600" }}>
                  {" "}
                  - EXPIRED
                </span>
              )}
              <br />
              {creatorSettings.companyName || "Company Name"} • Thank you for
              your consideration!
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
