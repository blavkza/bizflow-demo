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

  const subtotal = Number(quotation.totalAmount);
  const taxAmount = Number(quotation.taxAmount) || 0;
  const discount = Number(quotation.discountAmount) || 0;
  const total = subtotal + taxAmount - discount;

  const creatorSettings = quotation.creator?.GeneralSetting?.[0] || {};

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
            .compact-table td, .compact-table th {
              padding: 0.25rem !important;
            }
          `}</style>
      </Head>
      <Body style={{ backgroundColor: "#ffffff", position: "relative" }}>
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
          <Section style={{ marginBottom: "1rem" }}>
            <Row>
              <Column style={{ width: "60%" }}>
                {creatorSettings.logo && (
                  <Img
                    src={creatorSettings.logo}
                    alt="Company Logo"
                    style={{ height: "60px", marginBottom: "0.5rem" }}
                  />
                )}
                <Text style={{ color: "#4B5563" }}>
                  <Text
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: "0.25rem",
                      color: "#374151",
                    }}
                  >
                    {creatorSettings.companyName}
                  </Text>
                  <br />
                  {creatorSettings.Address}
                  <br />
                  {creatorSettings.city}, {creatorSettings.province}{" "}
                  {creatorSettings.postCode}
                  <br />
                  {creatorSettings.email}
                  <br />
                  {[
                    creatorSettings.phone,
                    creatorSettings.phone2,
                    creatorSettings.phone3,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                  <br />
                  {creatorSettings.taxId &&
                    `VAT Number: ${creatorSettings.taxId}`}
                </Text>
              </Column>
              <Column style={{ width: "40%", textAlign: "right" }}>
                <Heading
                  style={{
                    fontSize: "1.5rem",
                    color: accentColor,
                    marginBottom: "0.5rem",
                  }}
                >
                  QUOTATION
                </Heading>
                <div
                  style={{
                    backgroundColor: secondaryColor,
                    padding: "0.5rem",
                    borderRadius: "0.25rem",
                    display: "inline-block",
                    textAlign: "left",
                  }}
                >
                  <Text style={{ fontWeight: 700 }}>
                    #{quotation.quotationNumber}
                  </Text>
                  <Text>
                    <strong>Issued:</strong>{" "}
                    {new Date(quotation.issueDate).toLocaleDateString()}
                  </Text>
                  <Text>
                    <strong>Valid Until:</strong>{" "}
                    {new Date(quotation.validUntil).toLocaleDateString()}
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* Client Info + Status */}
          <Section style={{ marginBottom: "1rem" }}>
            <Row>
              <Column
                style={{
                  width: "50%",
                  backgroundColor: secondaryColor,
                  padding: "0.5rem",
                  borderRadius: "0.25rem",
                }}
              >
                <Text
                  style={{
                    fontWeight: 700,
                    marginBottom: "0.25rem",
                    color: "#374151",
                  }}
                >
                  QUOTATION FOR
                </Text>
                {quotation.client.company && (
                  <Text style={{ fontWeight: 500 }}>
                    {quotation.client.company}
                  </Text>
                )}
                <Text style={{ fontWeight: 500 }}>{quotation.client.name}</Text>
                <Text style={{ color: "#4B5563" }}>
                  {quotation.client.email}
                </Text>
                <Text style={{ color: "#4B5563" }}>
                  {quotation.client.phone}
                </Text>
                {quotation.client.taxNumber && (
                  <Text style={{ color: "#4B5563" }}>
                    VAT Number: {quotation.client.taxNumber}
                  </Text>
                )}
                {quotation.client.address && (
                  <Text style={{ color: "#4B5563" }}>
                    {quotation.client.address}
                  </Text>
                )}
              </Column>
              <Column
                style={{
                  width: "50%",
                  backgroundColor: secondaryColor,
                  padding: "0.5rem",
                  borderRadius: "0.25rem",
                  textAlign: "right",
                }}
              >
                <Text
                  style={{
                    fontWeight: 700,
                    marginBottom: "0.25rem",
                    color: "#374151",
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
                        : quotation.status === "EXPIRED"
                          ? "#FEE2E2"
                          : "#FEF3C7",
                    color:
                      quotation.status === "ACCEPTED"
                        ? "#065F46"
                        : quotation.status === "EXPIRED"
                          ? "#B91C1C"
                          : "#92400E",
                  }}
                >
                  {quotation.status === "ACCEPTED"
                    ? "ACCEPTED"
                    : quotation.status}
                </span>

                <div
                  style={{
                    marginTop: "1rem",
                    borderTop: "1px solid #E5E7EB",
                    paddingTop: "0.5rem",
                  }}
                >
                  <Text style={{ fontWeight: 700, color: "#374151" }}>
                    Payment Terms
                  </Text>
                  <Text style={{ color: "#4B5563", marginBottom: "0.5rem" }}>
                    {quotation.paymentTerms || "Standard payment terms apply"}
                  </Text>

                  {creatorSettings.bankName && creatorSettings.bankAccount && (
                    <div style={{ marginBottom: "0.25rem" }}>
                      <Text style={{ fontWeight: 600 }}>
                        {creatorSettings.bankName}
                      </Text>
                      <Text>{creatorSettings.bankAccount}</Text>
                    </div>
                  )}

                  {creatorSettings.bankName2 &&
                    creatorSettings.bankAccount2 && (
                      <div>
                        <Text style={{ fontWeight: 600 }}>
                          {creatorSettings.bankName2}
                        </Text>
                        <Text>{creatorSettings.bankAccount2}</Text>
                      </div>
                    )}
                </div>
              </Column>
            </Row>
          </Section>

          {/* Items Table */}
          <Section style={{ marginBottom: "1rem" }}>
            <table
              className="compact-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #E5E7EB",
                borderRadius: "0.25rem",
                overflow: "hidden",
              }}
            >
              <thead style={{ backgroundColor: secondaryColor }}>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.25rem" }}>
                    Description
                  </th>
                  <th style={{ textAlign: "center", padding: "0.25rem" }}>
                    Qty
                  </th>
                  <th style={{ textAlign: "right", padding: "0.25rem" }}>
                    Unit Price
                  </th>
                  <th style={{ textAlign: "right", padding: "0.25rem" }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {quotation.items.map((item, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#FFFFFF" : secondaryColor,
                    }}
                  >
                    <td style={{ padding: "0.25rem" }}>{item.description}</td>
                    <td style={{ padding: "0.25rem", textAlign: "center" }}>
                      {Number(item.quantity)}
                    </td>
                    <td style={{ padding: "0.25rem", textAlign: "right" }}>
                      R{Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td style={{ padding: "0.25rem", textAlign: "right" }}>
                      R
                      {(Number(item.quantity) * Number(item.unitPrice)).toFixed(
                        2
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Totals */}
          <Section style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  marginLeft: "auto",
                  width: "33%",
                }}
              >
                {/* Subtotal */}
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>Subtotal:</Text>
                  <Text>R{subtotal.toFixed(2)}</Text>
                </div>

                {/* Tax */}
                {taxAmount > 0 && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>
                      Tax ({((taxAmount / subtotal) * 100).toFixed(2)}%):
                    </Text>
                    <Text>R{taxAmount.toFixed(2)}</Text>
                  </div>
                )}

                {/* Discount */}
                {discount > 0 && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Discount:</Text>
                    <Text>-R{discount.toFixed(2)}</Text>
                  </div>
                )}

                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    fontSize: "0.875rem",
                  }}
                >
                  <Text>Total:</Text>
                  <Text style={{ color: accentColor }}>
                    R{total.toFixed(2)}
                  </Text>
                </div>
              </div>
            </div>
          </Section>

          {/* Footer */}
          <Section>
            <Hr
              style={{
                borderColor: "#E5E7EB",
                marginTop: "1rem",
                marginBottom: "0.5rem",
              }}
            />
            <Text
              style={{
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              {creatorSettings.website}
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              This quotation is valid until{" "}
              {new Date(quotation.validUntil).toLocaleDateString()}
            </Text>
            <Text
              style={{
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              {creatorSettings.companyName || "Company Name"} • Thank you for
              your consideration!
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
