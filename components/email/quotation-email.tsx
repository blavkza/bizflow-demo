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
  const accentColor = "#3B82F6"; // Blue color for quotations

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
            }
            .watermark {
              position: absolute;
              inset: 0;
              opacity: 0.05;
              z-index: 0;
              pointer-events: none;
              background-repeat: no-repeat;
              background-position: center;
              background-size: contain;
              filter: grayscale(100%);
              transform: rotate(-10deg);
            }
            .status-badge {
              display: inline-block;
              padding: 0.25rem 0.75rem;
              border-radius: 9999px;
              font-size: 0.75rem;
              font-weight: 600;
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
            padding: "2rem",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Header */}
          <Section style={{ marginBottom: "2rem" }}>
            <Row>
              <Column style={{ width: "50%" }}>
                {creatorSettings.logo && (
                  <Img
                    src={creatorSettings.logo}
                    alt="Company Logo"
                    style={{ height: "40px", marginBottom: "1rem" }}
                  />
                )}
                <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                  <Text
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
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
                  {creatorSettings.email} | {creatorSettings.phone}
                </Text>
              </Column>
              <Column style={{ width: "50%", textAlign: "right" }}>
                <Heading
                  style={{
                    fontSize: "2.25rem",
                    color: accentColor,
                    marginBottom: "1rem",
                  }}
                >
                  QUOTATION
                </Heading>
                <div
                  style={{
                    backgroundColor: secondaryColor,
                    padding: "1rem",
                    borderRadius: "0.375rem",
                    display: "inline-block",
                    textAlign: "left",
                  }}
                >
                  <Text style={{ fontWeight: 700 }}>
                    #{quotation.quotationNumber}
                  </Text>
                  <Text style={{ fontSize: "0.75rem" }}>
                    <strong>Issued:</strong>{" "}
                    {new Date(quotation.issueDate).toLocaleDateString()}
                  </Text>
                  <Text style={{ fontSize: "0.75rem" }}>
                    <strong>Valid Until:</strong>{" "}
                    {new Date(quotation.validUntil).toLocaleDateString()}
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* Client Info + Status */}
          <Section style={{ marginBottom: "2rem" }}>
            <Row>
              <Column
                style={{
                  width: "50%",
                  backgroundColor: secondaryColor,
                  padding: "1rem",
                  borderRadius: "0.375rem",
                }}
              >
                <Text
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
                    color: "#374151",
                  }}
                >
                  QUOTATION FOR
                </Text>
                <Text style={{ fontWeight: 500 }}>{quotation.client.name}</Text>
                <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                  {quotation.client.email}
                </Text>
                <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                  {quotation.client.phone}
                </Text>
                {quotation.client.address && (
                  <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
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
                  textAlign: "right",
                }}
              >
                <Text
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    marginBottom: "0.5rem",
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
                  {quotation.status}
                </span>
              </Column>
            </Row>
          </Section>

          {/* Items Table */}
          <Section style={{ marginBottom: "2rem" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.75rem",
              }}
            >
              <thead style={{ backgroundColor: secondaryColor }}>
                <tr>
                  <th style={{ textAlign: "left", padding: "0.75rem" }}>
                    Description
                  </th>
                  <th style={{ textAlign: "center", padding: "0.75rem" }}>
                    Qty
                  </th>
                  <th style={{ textAlign: "right", padding: "0.75rem" }}>
                    Unit Price
                  </th>
                  <th style={{ textAlign: "right", padding: "0.75rem" }}>
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
                    <td style={{ padding: "0.75rem" }}>{item.description}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      {Number(item.quantity)}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      R
                      {Number(item.unitPrice).toLocaleString("en-ZA", {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      R
                      {(
                        Number(item.quantity) * Number(item.unitPrice)
                      ).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>

          {/* Totals */}
          <Section>
            <div style={{ display: "flex" }}>
              <div
                style={{
                  marginLeft: "auto",
                  width: "33%",
                  fontSize: "0.75rem",
                }}
              >
                {/* Subtotal */}
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>Subtotal:</Text>
                  <Text>R{subtotal.toLocaleString()}</Text>
                </div>

                {/* Tax */}
                {taxAmount > 0 && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>
                      Tax ({((taxAmount / Number(subtotal)) * 100).toFixed(2)}
                      %):
                    </Text>
                    <Text>
                      R
                      {taxAmount.toLocaleString("en-ZA", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </div>
                )}

                {/* Discount */}
                {discount > 0 && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>Discount:</Text>
                    <Text>
                      R
                      {discount.toLocaleString("en-ZA", {
                        minimumFractionDigits: 2,
                      })}
                    </Text>
                  </div>
                )}

                {/* Total */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: "bold",
                    fontSize: "1rem",
                  }}
                >
                  <Text>Total:</Text>
                  <Text style={{ color: accentColor }}>
                    R
                    {total.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </div>
              </div>
            </div>
          </Section>

          {/* Notes & Footer */}
          <Section>
            {quotation.notes && (
              <Row>
                <Column>
                  <Text
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "#374151",
                    }}
                  >
                    Notes
                  </Text>
                  <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                    {quotation.notes}
                  </Text>
                </Column>
              </Row>
            )}
            <Hr
              style={{
                borderColor: "#E5E7EB",
                marginTop: "2rem",
                marginBottom: "1rem",
              }}
            />
            <Text
              style={{
                fontSize: "0.75rem",
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              {creatorSettings.website}
            </Text>
            <Text
              style={{
                fontSize: "0.75rem",
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              This quotation is valid until{" "}
              {new Date(quotation.validUntil).toLocaleDateString()}
            </Text>
            <Text
              style={{
                fontSize: "0.75rem",
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
