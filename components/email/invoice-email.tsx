// components/email/invoice-email.tsx
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

  // Calculate payment statistics
  const totalPaid =
    invoice.payments?.reduce((sum, payment) => {
      return sum + Number(payment.amount);
    }, 0) || 0;

  const remainingBalance = total - totalPaid;
  const paymentProgress = total > 0 ? (totalPaid / total) * 100 : 0;

  return (
    <Html>
      <Head>
        <title>Invoice #{invoice.invoiceNumber}</title>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: ${primaryColor};
            font-size: 12px;
            line-height: 1.4;
          }
          .watermark {
            position: absolute;
            inset: 0;
            opacity: 0.05;
            z-index: 0;
            pointer-events: none;
            background-repeat: no-repeat;
            background-position: center;
            background-size: 100%;
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
            padding: 0.25rem 0.5rem !important;
          }
          .border-gray-200 {
            border-color: #E5E7EB;
          }
          .payment-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .stat-card {
            background: white;
            border: 1px solid #E5E7EB;
            border-radius: 0.375rem;
            padding: 0.75rem;
            text-align: center;
          }
          .stat-value {
            font-size: 1rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
          }
          .stat-label {
            font-size: 0.625rem;
            color: #6B7280;
          }
          .amount-paid { color: #065F46; }
          .amount-remaining { color: #DC2626; }
          .amount-total { color: #1E40AF; }
          .progress-bar {
            width: 100%;
            height: 1rem;
            background-color: #E5E7EB;
            border-radius: 0.5rem;
            margin: 0.5rem 0;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background-color: ${accentColor};
            border-radius: 0.5rem;
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
            padding: "1rem",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Header */}
          <Section style={{ marginBottom: "0.5rem" }}>
            <Row>
              <Column style={{ width: "60%" }}>
                {invoice.creator.GeneralSetting[0]?.logo && (
                  <Img
                    src={invoice.creator.GeneralSetting[0].logo}
                    alt="Company Logo"
                    style={{ height: "40px", marginBottom: "0.5rem" }}
                  />
                )}
                <Text
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: "0.25rem",
                    color: "#374151",
                  }}
                >
                  {invoice.creator.GeneralSetting[0]?.companyName}
                </Text>
                <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                  {invoice.creator.GeneralSetting[0]?.Address}
                  <br />
                  {invoice.creator.GeneralSetting[0]?.city},{" "}
                  {invoice.creator.GeneralSetting[0]?.province}{" "}
                  {invoice.creator.GeneralSetting[0]?.postCode}
                  <br />
                  {invoice.creator.GeneralSetting[0]?.email}
                  <br />
                  {[
                    invoice.creator.GeneralSetting[0]?.phone,
                    invoice.creator.GeneralSetting[0]?.phone2,
                    invoice.creator.GeneralSetting[0]?.phone3,
                  ]
                    .filter(Boolean)
                    .join(" | ")}
                  {invoice.creator.GeneralSetting[0]?.taxId && (
                    <>
                      <br />
                      VAT Number: {invoice.creator.GeneralSetting[0]?.taxId}
                    </>
                  )}
                </Text>
              </Column>
              <Column style={{ width: "40%", textAlign: "right" }}>
                <Heading
                  style={{
                    fontSize: "1.5rem",
                    color: accentColor,
                    marginBottom: "0.5rem",
                    fontWeight: 700,
                  }}
                >
                  INVOICE
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
                  <Text style={{ fontWeight: 700, fontSize: "0.75rem" }}>
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
          <Section style={{ marginBottom: "0.5rem" }}>
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
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    marginBottom: "0.25rem",
                    color: "#374151",
                  }}
                >
                  BILL TO
                </Text>
                {invoice.client.company && (
                  <Text style={{ fontWeight: 500, fontSize: "0.75rem" }}>
                    {invoice.client.company}
                  </Text>
                )}
                <Text style={{ fontWeight: 500, fontSize: "0.75rem" }}>
                  {invoice.client.name}
                </Text>
                <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                  {invoice.client.email}
                </Text>
                <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                  {invoice.client.phone}
                </Text>
                {invoice.client.taxNumber && (
                  <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                    VAT Number: {invoice.client.taxNumber}
                  </Text>
                )}
                {invoice.client.address && (
                  <Text style={{ fontSize: "0.75rem", color: "#4B5563" }}>
                    {invoice.client.address}
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
                    fontSize: "0.75rem",
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
              </Column>
            </Row>
          </Section>

          {/* Payment Statistics */}
          <Section style={{ marginBottom: "0.5rem" }}>
            <div className="payment-stats">
              <div className="stat-card">
                <div className="stat-value amount-total">
                  R{total.toLocaleString()}
                </div>
                <div className="stat-label">Total Amount</div>
              </div>
              <div className="stat-card">
                <div className="stat-value amount-paid">
                  R{totalPaid.toLocaleString()}
                </div>
                <div className="stat-label">Amount Paid</div>
              </div>
              <div className="stat-card">
                <div className="stat-value amount-remaining">
                  R{remainingBalance.toLocaleString()}
                </div>
                <div className="stat-label">Amount Remaining</div>
              </div>
            </div>

            {/* Payment Progress */}
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "0.25rem",
                  fontSize: "0.75rem",
                }}
              >
                <span>Payment Progress</span>
                <span>
                  <strong>
                    ${total > 0 ? paymentProgress.toFixed(1) : "0.0"}% Complete
                  </strong>
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${total > 0 ? paymentProgress : 0}%` }}
                ></div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.625rem",
                  color: "#6B7280",
                }}
              >
                <span>R${totalPaid.toLocaleString()} Paid</span>
                <span>R${remainingBalance.toLocaleString()} Remaining</span>
              </div>
            </div>
          </Section>

          {/* Items Table */}
          <Section style={{ marginBottom: "0.5rem" }}>
            <table
              className="compact-table"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.75rem",
                border: `1px solid #E5E7EB`,
                borderRadius: "0.25rem",
                overflow: "hidden",
              }}
            >
              <thead style={{ backgroundColor: secondaryColor }}>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.25rem 0.5rem",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "0.25rem 0.5rem",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Qty
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "0.25rem 0.5rem",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Unit Price
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "0.25rem 0.5rem",
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
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
                      borderTop: `1px solid #E5E7EB`,
                    }}
                  >
                    <td style={{ padding: "0.25rem 0.5rem" }}>
                      {item.description}
                    </td>
                    <td
                      style={{
                        padding: "0.25rem 0.5rem",
                        textAlign: "center",
                      }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      style={{
                        padding: "0.25rem 0.5rem",
                        textAlign: "right",
                      }}
                    >
                      R{Number(item.unitPrice).toFixed(2)}
                    </td>
                    <td
                      style={{
                        padding: "0.25rem 0.5rem",
                        textAlign: "right",
                      }}
                    >
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

          {/* Payment Instructions */}
          <Section
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: secondaryColor,
              borderRadius: "0.25rem",
            }}
          >
            <Text
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                marginBottom: "0.5rem",
              }}
            >
              PAYMENT INSTRUCTIONS
            </Text>
            {invoice.paymentTerms && (
              <Text style={{ fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                <strong>Terms:</strong> {invoice.paymentTerms}
              </Text>
            )}
            {invoice.creator.GeneralSetting[0]?.bankName && (
              <Text style={{ fontSize: "0.75rem" }}>
                <strong>{invoice.creator.GeneralSetting[0]?.bankName}:</strong>{" "}
                {invoice.creator.GeneralSetting[0]?.bankAccount}
              </Text>
            )}
            {invoice.creator.GeneralSetting[0]?.bankName2 && (
              <Text style={{ fontSize: "0.75rem" }}>
                <strong>{invoice.creator.GeneralSetting[0]?.bankName2}:</strong>{" "}
                {invoice.creator.GeneralSetting[0]?.bankAccount2}
              </Text>
            )}
          </Section>

          {/* Footer */}
          <Section style={{ marginTop: "1rem" }}>
            {invoice.note && (
              <Text
                style={{
                  fontSize: "0.75rem",
                  color: "#4B5563",
                  textAlign: "center",
                }}
              >
                {invoice.note}
              </Text>
            )}
            <Text
              style={{
                fontSize: "0.75rem",
                color: "#9CA3AF",
                textAlign: "center",
                marginTop: "0.5rem",
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
          </Section>

          {/* Attachment Notice */}
          <Section
            style={{
              marginTop: "1rem",
              padding: "0.75rem",
              backgroundColor: "#EFF6FF",
              borderRadius: "0.25rem",
            }}
          >
            <Text
              style={{
                fontSize: "0.75rem",
                color: "#1E40AF",
                textAlign: "center",
              }}
            >
              📎 A detailed invoice PDF is attached to this email
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
