import { PaymentDetail } from "@/app/dashboard/payments/[id]/types";
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

interface PayslipEmailProps {
  payment: PaymentDetail;
  companyInfo?: {
    companyName: string;
    address: string;
    address2?: string;
    phone?: string;
    email?: string;
    logo?: string;
    bankName?: string;
    bankAccount?: string;
    bankName2?: string;
    bankAccount2?: string;
  };
}

export function PayslipEmail({ payment, companyInfo }: PayslipEmailProps) {
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Format number
  const formatNumber = (amount: number) => {
    return amount.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Calculate totals
  const totalBonuses = payment.paymentBonuses.reduce(
    (sum, bonus) => sum + bonus.amount,
    0
  );
  const totalDeductions = payment.paymentDeductions.reduce(
    (sum, deduction) => sum + deduction.amount,
    0
  );
  const grossSalary =
    payment.baseAmount + payment.overtimeAmount + totalBonuses;

  // Find specific deductions
  const uifDeduction = payment.paymentDeductions.find(
    (d) =>
      d.deductionType.includes("UIF") ||
      d.deductionType.toLowerCase().includes("unemployment")
  );

  const taxDeduction = payment.paymentDeduction.find(
    (d) =>
      d.deductionType === "TAX" || d.deductionType.toLowerCase().includes("tax")
  );

  const toolsDeductions = payment.paymentDeduction.filter(
    (d) =>
      d.deductionType === "TOOLS" ||
      d.deductionType.toLowerCase().includes("tool")
  );
  const totalTools = toolsDeductions.reduce((sum, d) => sum + d.amount, 0);

  const vehicleDeduction = payment.paymentDeduction.find(
    (d) =>
      d.deductionType.includes("VEHICLE") ||
      d.deductionType.toLowerCase().includes("vehicle")
  );

  // Format bonus type
  const formatBonusType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Prepare bonus rows
  const bonusRows = [];
  for (let i = 0; i < 3; i++) {
    if (i < payment.paymentBonuses.length) {
      const bonus = payment.paymentBonuses[i];
      bonusRows.push({
        type: formatBonusType(bonus.bonusType),
        amount: bonus.amount,
      });
    } else {
      if (i === 0) bonusRows.push({ type: "Bonus", amount: 0 });
      else if (i === 1) bonusRows.push({ type: "Savings Bonus", amount: 0 });
      else if (i === 2) bonusRows.push({ type: "Medical Expenses", amount: 0 });
    }
  }

  return (
    <Html>
      <Head>
        <style>{`
            body { font-family: Arial, sans-serif; }
            .table-header { background-color: #f5f5f5; font-weight: bold; text-align: center; font-size: 10px; padding: 8px 4px; }
            .table-cell { border: 1px solid #000; padding: 5px 8px; font-size: 10px; vertical-align: top; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row { font-weight: bold; background-color: #f0f0f0; }
          `}</style>
      </Head>
      <Preview>
        Payslip for {payment.worker?.firstName} {payment.worker?.lastName} -{" "}
        {formatDate(payment.payDate)}
      </Preview>
      <Body
        style={{ backgroundColor: "#ffffff", margin: "0", padding: "20px" }}
      >
        <Container style={{ maxWidth: "800px", margin: "0 auto" }}>
          {/* Header Section */}
          <Section style={{ marginBottom: "20px", textAlign: "center" }}>
            {companyInfo?.logo && (
              <Img
                src={companyInfo.logo}
                width="150"
                alt="Company Logo"
                style={{ marginBottom: "10px", objectFit: "contain" }}
              />
            )}
            <Text
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                margin: "0",
                textTransform: "uppercase",
              }}
            >
              PAYSLIP
            </Text>
          </Section>

          {/* Company Information */}
          <Section style={{ marginBottom: "20px" }}>
            <Text style={{ fontSize: "11px", lineHeight: "1.4", margin: "0" }}>
              <strong>Name of Employer:</strong>
              <br />
              {companyInfo?.companyName ||
                "Ndou Electrical Construction And Supply Engineers"}
            </Text>
            <Text
              style={{ fontSize: "11px", lineHeight: "1.4", margin: "5px 0" }}
            >
              <strong>Company Address:</strong>
              <br />
              {companyInfo?.address || "Shayandima 88 Khwevha Street"}
              <br />
              {companyInfo?.address2 ||
                "After Shoprite, after township next to Gwamasenga Dry Clean"}
            </Text>
          </Section>

          {/* Employee Details */}
          <Section style={{ marginBottom: "20px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "11px",
              }}
            >
              <tr>
                <td style={{ padding: "3px 0", width: "150px" }}>
                  <strong>Employee Code:</strong>
                </td>
                <td style={{ padding: "3px 0" }}>
                  {payment.worker?.employeeNumber || "NECS 003"}
                </td>
                <td style={{ padding: "3px 0", width: "150px" }}>
                  <strong>Name of Employee:</strong>
                </td>
                <td style={{ padding: "3px 0" }}>
                  {payment.worker?.firstName || "Ramahala"}{" "}
                  {payment.worker?.lastName || "Andani"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0" }}>
                  <strong>Employee Address:</strong>
                </td>
                <td style={{ padding: "3px 0" }}>
                  {payment.worker?.address || "House No 702"}
                </td>
                <td style={{ padding: "3px 0" }}>
                  <strong>I.D. Number:</strong>
                </td>
                <td style={{ padding: "3px 0" }}>
                  {payment.worker?.idNumber || "9507135493083"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0" }}></td>
                <td style={{ padding: "3px 0" }}>
                  {payment.worker?.address ? "" : "Tshisaulu, Siawoadza"}
                </td>
                <td style={{ padding: "3px 0" }}>
                  <strong>Job Title:</strong>
                </td>
                <td style={{ padding: "3px 0" }}>
                  {payment.worker?.position || "Site Manager/Technician"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0" }}>
                  <strong>Tax Number:</strong>
                </td>
                <td style={{ padding: "3px 0" }}>
                  {payment.worker?.taxNumber || "1267131199"}
                </td>
                <td style={{ padding: "3px 0" }}>
                  <strong>Pay Date:</strong>
                </td>
                <td style={{ padding: "3px 0" }}>
                  {formatDate(payment.payDate)}
                </td>
              </tr>
            </table>
          </Section>

          {/* Separator */}
          <hr style={{ border: "1px solid #000", margin: "20px 0" }} />

          {/* Main Payslip Table */}
          <Section style={{ marginBottom: "20px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "10px",
              }}
            >
              <thead>
                <tr>
                  <th className="table-header" style={{ width: "25%" }}></th>
                  <th className="table-header" style={{ width: "10%" }}>
                    Units
                  </th>
                  <th
                    className="table-header"
                    style={{ width: "15%", textAlign: "right" }}
                  >
                    Amount
                  </th>
                  <th className="table-header" style={{ width: "25%" }}>
                    Deductions
                  </th>
                  <th className="table-header" style={{ width: "10%" }}>
                    Opening Balance
                  </th>
                  <th
                    className="table-header"
                    style={{ width: "15%", textAlign: "right" }}
                  >
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Basic Salary Row */}
                <tr>
                  <td className="table-cell">Basic Salary</td>
                  <td className="table-cell text-center">R</td>
                  <td className="table-cell text-right">
                    {formatNumber(payment.baseAmount)}
                  </td>
                  <td className="table-cell">Unemployment Insurance Fund</td>
                  <td className="table-cell text-center">-</td>
                  <td className="table-cell text-right">
                    {uifDeduction ? formatNumber(uifDeduction.amount) : "-"}
                  </td>
                </tr>

                {/* Bonus Rows */}
                {bonusRows.map((bonus, index) => (
                  <tr key={index}>
                    <td className="table-cell">{bonus.type}</td>
                    <td className="table-cell text-center">R</td>
                    <td className="table-cell text-right">
                      {bonus.amount > 0 ? formatNumber(bonus.amount) : "-"}
                    </td>
                    <td className="table-cell">
                      {index === 0 ? "Employee Tax" : ""}
                      {index === 1 ? "Tools" : ""}
                      {index === 2 ? "Vehicle negligence" : ""}
                    </td>
                    <td className="table-cell text-center">-</td>
                    <td className="table-cell text-right">
                      {index === 0
                        ? taxDeduction
                          ? formatNumber(taxDeduction.amount)
                          : "-"
                        : ""}
                      {index === 1
                        ? totalTools > 0
                          ? formatNumber(totalTools)
                          : "-"
                        : ""}
                      {index === 2
                        ? vehicleDeduction
                          ? formatNumber(vehicleDeduction.amount)
                          : "-"
                        : ""}
                    </td>
                  </tr>
                ))}

                {/* Total Row */}
                <tr className="total-row">
                  <td className="table-cell">
                    <strong>Total Income</strong>
                  </td>
                  <td className="table-cell text-center">
                    <strong>R</strong>
                  </td>
                  <td className="table-cell text-right">
                    <strong>{formatNumber(grossSalary)}</strong>
                  </td>
                  <td className="table-cell">
                    <strong>Total Deductions</strong>
                  </td>
                  <td className="table-cell"></td>
                  <td className="table-cell text-right">
                    <strong>{formatNumber(totalDeductions)}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* Net Pay */}
          <Section style={{ textAlign: "right", marginBottom: "20px" }}>
            <Text style={{ fontSize: "12px", fontWeight: "bold" }}>
              Net Pay: {formatCurrency(payment.netAmount)}
            </Text>
          </Section>

          {/* Bottom Sections */}
          <Section
            style={{ display: "flex", gap: "40px", marginBottom: "20px" }}
          >
            {/* Company Deductions */}
            <div style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                  backgroundColor: "#f5f5f5",
                  padding: "3px",
                  border: "1px solid #000",
                  marginBottom: "5px",
                }}
              >
                Company Deductions
              </Text>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "10px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #000",
                        textAlign: "left",
                      }}
                    ></th>
                    <th
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #000",
                        textAlign: "right",
                        width: "100px",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{ padding: "5px 8px", border: "1px solid #000" }}
                    >
                      Unemployment Insurance Fund
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #000",
                        textAlign: "right",
                      }}
                    >
                      {uifDeduction
                        ? "R " + formatNumber(uifDeduction.amount)
                        : "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* YTD Totals */}
            <div style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: "11px",
                  fontWeight: "bold",
                  textAlign: "center",
                  backgroundColor: "#f5f5f5",
                  padding: "3px",
                  border: "1px solid #000",
                  marginBottom: "5px",
                }}
              >
                YTD Totals
              </Text>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "10px",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #000",
                        textAlign: "left",
                      }}
                    ></th>
                    <th
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #000",
                        textAlign: "right",
                        width: "100px",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      style={{ padding: "5px 8px", border: "1px solid #000" }}
                    >
                      Income taxable
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #000",
                        textAlign: "right",
                      }}
                    >
                      {formatNumber(grossSalary)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{ padding: "5px 8px", border: "1px solid #000" }}
                    >
                      Payment to employee
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #000",
                        textAlign: "right",
                      }}
                    >
                      {formatNumber(payment.netAmount)}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{ padding: "5px 8px", border: "1px solid #000" }}
                    >
                      Tax Paid
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #000",
                        textAlign: "right",
                      }}
                    >
                      {taxDeduction ? formatNumber(taxDeduction.amount) : "-"}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{ padding: "5px 8px", border: "1px solid #000" }}
                    >
                      Provision for Tax on Annual Bonus
                    </td>
                    <td
                      style={{
                        padding: "5px 8px",
                        border: "1px solid #000",
                        textAlign: "right",
                      }}
                    >
                      0.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* Fringe Benefits */}
          <Section style={{ marginBottom: "20px" }}>
            <Text
              style={{
                fontSize: "11px",
                fontWeight: "bold",
                display: "inline-block",
                width: "120px",
              }}
            >
              Fringe Benefits
            </Text>
            <Text style={{ fontSize: "11px", display: "inline" }}>Amount</Text>
          </Section>

          {/* Footer */}
          <Section
            style={{
              marginTop: "40px",
              borderTop: "1px solid #eee",
              padding: "15px",
              backgroundColor: "#f9f9f9",
              textAlign: "center",
            }}
          >
            {companyInfo?.phone && (
              <Text
                style={{ fontSize: "10px", margin: "0 0 5px 0", color: "#555" }}
              >
                Contact: {companyInfo.phone}{" "}
                {companyInfo.email ? `| ${companyInfo.email}` : ""}
              </Text>
            )}
            {companyInfo?.bankName && companyInfo?.bankAccount && (
              <Text style={{ fontSize: "10px", margin: "0", color: "#555" }}>
                <strong>{companyInfo.bankName}:</strong>{" "}
                {companyInfo.bankAccount}
                {companyInfo.bankName2 && companyInfo.bankAccount2 && (
                  <>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <strong>{companyInfo.bankName2}:</strong>{" "}
                    {companyInfo.bankAccount2}
                  </>
                )}
              </Text>
            )}
          </Section>

          {/* View Online Link */}
          <Section style={{ textAlign: "center", marginTop: "20px" }}>
            <Link
              href={`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/payslips/${payment.id}`}
              style={{
                backgroundColor: "#990000",
                color: "#ffffff",
                padding: "10px 20px",
                textDecoration: "none",
                fontWeight: "bold",
                fontSize: "12px",
                borderRadius: "4px",
              }}
            >
              View Payslip Online
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
