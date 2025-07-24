// components/emails/invoice-email.tsx
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
import { InvoiceProps } from "@/types/invoice";

interface InvoiceEmailProps {
  invoice: InvoiceProps;
}

export function InvoiceEmail({ invoice }: InvoiceEmailProps) {
  const primaryColor = "#1F2937"; // Gray-800
  const secondaryColor = "#F3F4F6"; // Gray-100
  const accentColor = "#10B981"; // Emerald-500

  const subtotal = invoice.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );
  const taxAmount = Number(invoice.taxAmount) || 0;
  const discount = Number(invoice.discountAmount) || 0;
  const total = subtotal + taxAmount - discount;

  return (
    <Html>
      <Head>
        <title>Invoice #{invoice.invoiceNumber}</title>
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
        {/* Watermark */}
        {invoice.creator.GeneralSetting[0]?.logo && (
          <div
            className="watermark"
            style={{
              backgroundImage: `url(${invoice.creator.GeneralSetting[0].logo})`,
            }}
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
                {invoice.creator.GeneralSetting[0]?.logo && (
                  <Img
                    src={invoice.creator.GeneralSetting[0].logo}
                    alt="Company Logo"
                    style={{ height: "0px", marginBottom: "1rem" }}
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
                    {invoice.creator.GeneralSetting[0]?.companyName}
                  </Text>
                  <br />
                  {invoice.creator.GeneralSetting[0]?.Address}
                  <br />
                  {invoice.creator.GeneralSetting[0]?.city},{" "}
                  {invoice.creator.GeneralSetting[0]?.province}{" "}
                  {invoice.creator.GeneralSetting[0]?.postCode}
                  <br />
                  {invoice.creator.GeneralSetting[0]?.email} |{" "}
                  {invoice.creator.GeneralSetting[0]?.phone}
                  <br />
                  Tax Number : {invoice.creator.GeneralSetting[0]?.taxId}
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
                  INVOICE
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
                    #{invoice.invoiceNumber}
                  </Text>
                  <Text style={{ fontSize: "0.75rem" }}>
                    <strong>Issued:</strong>{" "}
                    {new Date(invoice.issueDate).toLocaleDateString()}
                  </Text>
                  <Text style={{ fontSize: "0.75rem" }}>
                    <strong>Due:</strong>{" "}
                    {new Date(invoice.dueDate).toLocaleDateString()}
                  </Text>
                </div>
              </Column>
            </Row>
          </Section>

          {/* BILL TO + STATUS */}
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
                  BILL TO
                </Text>
                {invoice.client.company && (
                  <Text style={{ fontWeight: 500 }}>
                    {invoice.client.company}
                  </Text>
                )}
                <Text style={{ fontWeight: 500 }}>{invoice.client.name}</Text>
                <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                  {invoice.client.email}
                </Text>
                <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                  {invoice.client.phone}
                </Text>
                {invoice.client.address && (
                  <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                    {invoice.client.address}
                  </Text>
                )}
                {invoice.client.taxNumber && (
                  <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                    Tax Number : {invoice.client.taxNumber}
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
                      invoice.status === "PAID" ? "#D1FAE5" : "#FEE2E2",
                    color: invoice.status === "PAID" ? "#065F46" : "#B91C1C",
                  }}
                >
                  {invoice.status}
                </span>
                {invoice.status === "PAID" && (
                  <Text
                    style={{
                      fontSize: "0.75rem",
                      marginTop: "0.25rem",
                      color: "#4B5563",
                    }}
                  >
                    Paid on {new Date(invoice.issueDate).toLocaleDateString()}
                  </Text>
                )}
                {invoice.creator.GeneralSetting[0]?.bankAccount && (
                  <>
                    <Text
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        marginTop: "1rem",
                        color: "#374151",
                      }}
                    >
                      Payment Information
                    </Text>
                    <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                      Please make payments to the account below:
                    </Text>
                    <Text
                      style={{
                        fontSize: "0.75rem",
                        marginTop: "0.25rem",
                        color: "#4B5563",
                      }}
                    >
                      <strong>Account #:</strong>{" "}
                      {invoice.creator.GeneralSetting[0].bankAccount}
                    </Text>
                  </>
                )}
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
                {invoice.items.map((item, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor:
                        index % 2 === 0 ? "#FFFFFF" : secondaryColor,
                    }}
                  >
                    <td style={{ padding: "0.75rem" }}>{item.description}</td>
                    <td style={{ padding: "0.75rem", textAlign: "center" }}>
                      {item.quantity}
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
                      ).toLocaleString("en-ZA", {
                        minimumFractionDigits: 2,
                      })}
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
                  <Text>
                    R
                    {subtotal.toLocaleString("en-ZA", {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                </div>

                {/* Tax */}
                {taxAmount > 0 && (
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Text>
                      Tax ({((taxAmount / subtotal) * 100).toFixed(2)}%):
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
                  <Text>Total Due:</Text>
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
            {invoice.note && (
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
                    {invoice.note}
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
              {invoice.creator.GeneralSetting[0]?.website}
            </Text>
            <Text
              style={{
                fontSize: "0.75rem",
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              Thank you for your business!
            </Text>
            <Text
              style={{
                fontSize: "0.75rem",
                color: "#9CA3AF",
                textAlign: "center",
              }}
            >
              {invoice.creator.GeneralSetting[0]?.companyName || "Company Name"}{" "}
              • Terms: Net{" "}
              {invoice.dueDate
                ? Math.ceil(
                    (new Date(invoice.dueDate).getTime() -
                      new Date(invoice.issueDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 30}{" "}
              Days
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
