import { HRSettings } from "@prisma/client";

// --- Configuration & Constants ---
const STATUTORY_LIMITS = {
  // 2024/2025 Tax Year
  UIF_CEILING: 17712, // Monthly remuneration cap for UIF
  MINIMUM_WAGE: 27.58, // Hourly (2024 rate)
  BCEA_DEDUCTION_CAP: 0.25, // Max 25% for non-statutory deductions
  FREELANCER_TAX_RATE: 0.25, // Standard 25% withholding for Independent Contractors
  PRIMARY_REBATE: 17235, // Annual Primary Rebate (Under 65)
  MEDICAL_CREDITS: {
    PRIMARY: 364,
    FIRST_DEP: 364,
    SUBSEQUENT: 246,
  },
  TAX_THRESHOLD: 95750, // 2024 threshold (2025 not yet published)
};

// --- Interfaces ---
export interface PerformanceMetrics {
  quality: number;
  productivity: number;
  attendance: number;
  teamwork: number;
}

export interface BonusCalculation {
  type: string;
  amount: number;
  description: string;
  isPercentage: boolean;
  percentageRate?: number;
  isTaxable: boolean;
}

export interface DeductionCalculation {
  type: string;
  amount: number;
  description: string;
  isPercentage: boolean;
  percentageRate?: number;
  isStatutory: boolean;
}

export interface PayrollCalculationResult {
  baseAmount: number;
  overtimeAmount: number;
  bonusAmount: number;
  deductionAmount: number;
  grossAmount: number;
  netAmount: number;
  bonuses: BonusCalculation[];
  deductions: DeductionCalculation[];
  performanceScore: number;
  medicalTaxCredit: number;
  nonStatutoryDeductionAmount: number;
  warnings: string[];
}

// --- Helpers ---
function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function calculateMedicalTaxCredit(dependants: number = 0): number {
  if (dependants < 0) return 0;

  const { PRIMARY, FIRST_DEP, SUBSEQUENT } = STATUTORY_LIMITS.MEDICAL_CREDITS;
  let credit = PRIMARY; // Main member

  if (dependants >= 1) {
    credit += FIRST_DEP;
  }

  if (dependants >= 2) {
    credit += (dependants - 1) * SUBSEQUENT;
  }

  return roundCurrency(credit);
}

export function calculatePerformanceScore(metrics: PerformanceMetrics): number {
  const { quality, productivity, attendance, teamwork } = metrics;

  const breakdown = {
    taskPerformance: quality * 0.35,
    productivity: productivity * 0.25,
    attendance: attendance * 0.15,
    projectContribution: 15, // Fixed
    teamwork: teamwork * 0.1,
  };

  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  return Math.round(total);
}

// --- Core Calculation Functions ---
export function calculateBonuses(
  baseAmount: number,
  overtimeAmount: number,
  hrSettings: HRSettings,
  employeeType: "EMPLOYEE" | "FREELANCER" | "TRAINEE",
  performanceMetrics?: PerformanceMetrics,
  attendanceBreakdown?: any,
): BonusCalculation[] {
  const bonuses: BonusCalculation[] = [];
  const currentMonth = new Date().getMonth() + 1;

  if (employeeType === "FREELANCER") return bonuses;

  const score = performanceMetrics
    ? calculatePerformanceScore(performanceMetrics)
    : 0;
  let annualBonusApplied = false;

  // 1. Annual Bonus
  if (hrSettings.annualBonusEnabled) {
    const isBonusMonth =
      hrSettings.annualBonusType === "DECEMBER" ? currentMonth === 12 : false;

    if (isBonusMonth || hrSettings.annualBonusType === "ALL_MONTHS") {
      const percentage = hrSettings.annualBonusPercentage || 0;
      const amount = roundCurrency((baseAmount * percentage) / 100);

      bonuses.push({
        type: "ANNUAL_BONUS",
        amount,
        description: `Annual Bonus (${percentage}%)`,
        isPercentage: true,
        percentageRate: percentage,
        isTaxable: true,
      });
      annualBonusApplied = true;
    }
  }

  // 2. Performance Bonus (Score > 95)
  if (hrSettings.performanceBonusEnabled && score > 95) {
    const percentage = hrSettings.performanceBonusPercentage || 5;
    const amount = roundCurrency((baseAmount * percentage) / 100);

    bonuses.push({
      type: "PERFORMANCE_BONUS",
      amount,
      description: `Performance Bonus (Score: ${score})`,
      isPercentage: true,
      percentageRate: percentage,
      isTaxable: true,
    });
  }

  // 3. Spot Bonus
  if (hrSettings.spotBonusEnabled) {
    const amount = roundCurrency(hrSettings.spotBonusAmount || 500);
    bonuses.push({
      type: "SPOT_BONUS",
      amount,
      description: "Spot Bonus",
      isPercentage: false,
      isTaxable: true,
    });
  }

  // 4. Merit Bonus
  if (hrSettings.meritBonusEnabled) {
    const percentage = hrSettings.meritBonusPercentage || 3;
    const amount = roundCurrency((baseAmount * percentage) / 100);
    bonuses.push({
      type: "MERIT_BONUS",
      amount,
      description: `Merit Bonus (${percentage}%)`,
      isPercentage: true,
      percentageRate: percentage,
      isTaxable: true,
    });
  }

  // 5. Appreciation Bonus
  if (hrSettings.appreciationBonusEnabled) {
    const amount = roundCurrency(hrSettings.appreciationBonusAmount || 250);
    bonuses.push({
      type: "APPRECIATION_BONUS",
      amount,
      description: "Appreciation Bonus",
      isPercentage: false,
      isTaxable: true,
    });
  }

  // 6. Incentive Payment
  if (hrSettings.incentivePaymentEnabled) {
    const percentage = hrSettings.incentivePaymentPercentage || 4;
    const amount = roundCurrency((baseAmount * percentage) / 100);
    bonuses.push({
      type: "INCENTIVE_PAYMENT",
      amount,
      description: `Incentive Payment (${percentage}%)`,
      isPercentage: true,
      percentageRate: percentage,
      isTaxable: true,
    });
  }

  // 7. Recognition Award
  if (hrSettings.recognitionAwardEnabled) {
    const amount = roundCurrency(hrSettings.recognitionAwardAmount || 300);
    bonuses.push({
      type: "RECOGNITION_AWARD",
      amount,
      description: "Recognition Award",
      isPercentage: false,
      isTaxable: true,
    });
  }

  // 8. Profit Sharing
  if (hrSettings.profitSharingEnabled) {
    const percentage = hrSettings.profitSharingPercentage || 10;
    const amount = roundCurrency((baseAmount * percentage) / 100);
    bonuses.push({
      type: "PROFIT_SHARING",
      amount,
      description: `Profit Sharing (${percentage}%)`,
      isPercentage: true,
      percentageRate: percentage,
      isTaxable: true,
    });
  }

  // 9. 13th Cheque (Double-dip protection)
  if (
    hrSettings.thirteenthChequeEnabled &&
    !annualBonusApplied &&
    currentMonth === 12
  ) {
    const amount = roundCurrency(baseAmount);
    bonuses.push({
      type: "THIRTEENTH_CHEQUE",
      amount,
      description: "13th Cheque",
      isPercentage: false,
      isTaxable: true,
    });
  }

  // 10. Attendance Bonus
  if (hrSettings.attendanceBonusEnabled && attendanceBreakdown) {
    const totalDays = attendanceBreakdown.totalDays || 22;
    const absentCount =
      attendanceBreakdown.effectiveAbsentDays !== undefined
        ? attendanceBreakdown.effectiveAbsentDays
        : attendanceBreakdown.absentDays || 0;

    const attendanceRate =
      totalDays > 0 ? ((totalDays - absentCount) / totalDays) * 100 : 0;

    if (attendanceRate >= 95) {
      const percentage = hrSettings.attendanceBonusPercentage || 2;
      const amount = roundCurrency((baseAmount * percentage) / 100);
      bonuses.push({
        type: "ATTENDANCE_BONUS",
        amount,
        description: `Attendance Bonus (${attendanceRate.toFixed(1)}%)`,
        isPercentage: true,
        percentageRate: percentage,
        isTaxable: true,
      });
    }
  }

  // 11. Overtime Bonus
  if (hrSettings.overtimeBonusEnabled && overtimeAmount > 0) {
    const percentage = hrSettings.overtimeBonusPercentage || 10;
    const amount = roundCurrency((overtimeAmount * percentage) / 100);
    bonuses.push({
      type: "OVERTIME_BONUS",
      amount,
      description: `Overtime Bonus (+${percentage}%)`,
      isPercentage: true,
      percentageRate: percentage,
      isTaxable: true,
    });
  }

  return bonuses;
}

export function calculateDeductions(
  grossAmount: number,
  baseAmount: number,
  hrSettings: HRSettings,
  employeeType: "EMPLOYEE" | "FREELANCER" | "TRAINEE",
  pensionAmount: number,
  medicalTaxCredit: number,
  existingLoans: number = 0,
  warnings: string[] = [],
): { deductions: DeductionCalculation[]; nonStatutoryDeductionAmount: number } {
  const deductions: DeductionCalculation[] = [];
  let totalNonStatutoryDeduction = 0;

  const maxNonStatutoryDeduction = roundCurrency(
    grossAmount * STATUTORY_LIMITS.BCEA_DEDUCTION_CAP,
  );

  if (employeeType === "FREELANCER") {
    if (hrSettings.taxEnabled) {
      warnings.push(
        "⚠️ FREELANCER TAX WARNING: 25% withholding is estimated. For SARS compliance, ensure:",
      );
      warnings.push("   1. IRP30 directive from SARS OR");
      warnings.push("   2. Provisional tax registration OR");
      warnings.push("   3. Exemption certificate if applicable");

      const taxAmount = roundCurrency(
        grossAmount * STATUTORY_LIMITS.FREELANCER_TAX_RATE,
      );
      if (taxAmount > 0) {
        deductions.push({
          type: "WITHHOLDING_TAX",
          amount: taxAmount,
          description: "Estimated Withholding Tax (25%) - Verify with SARS",
          isPercentage: true,
          percentageRate: 25,
          isStatutory: true,
        });
      }
    }
    return { deductions, nonStatutoryDeductionAmount: 0 };
  }

  const addNonStatutoryDeduction = (deduction: DeductionCalculation) => {
    if (totalNonStatutoryDeduction < maxNonStatutoryDeduction) {
      const remainingCap =
        maxNonStatutoryDeduction - totalNonStatutoryDeduction;
      const actualAmount = Math.min(deduction.amount, remainingCap);
      const roundedAmount = roundCurrency(actualAmount);

      if (roundedAmount > 0) {
        deductions.push({ ...deduction, amount: roundedAmount });
        totalNonStatutoryDeduction = roundCurrency(
          totalNonStatutoryDeduction + roundedAmount,
        );
      }
    }
  };

  // --- 1. UIF (Statutory) ---
  if (hrSettings.uifEnabled) {
    const uifCeiling = STATUTORY_LIMITS.UIF_CEILING;
    const incomeForUIF = Math.min(grossAmount, uifCeiling);
    const percentage = hrSettings.uifPercentage || 1;
    const amount = roundCurrency((incomeForUIF * percentage) / 100);

    warnings.push(`ℹ️ UIF: Employee contribution = R${amount.toFixed(2)} (1%)`);
    warnings.push(
      `ℹ️ UIF: Employer contribution = R${amount.toFixed(2)} (1%) - Add to EMP201`,
    );

    // FIXED: SARS audit-friendly wording
    deductions.push({
      type: "UIF",
      amount,
      description: `UIF (1%) capped at R177.12`,
      isPercentage: true,
      percentageRate: percentage,
      isStatutory: true,
    });
  }

  // --- 2. Pension (Contractual) ---
  if (hrSettings.pensionEnabled) {
    const percentage = hrSettings.pensionPercentage || 7.5;

    // FIXED: Mark as non-statutory (contractual)
    deductions.push({
      type: "PENSION",
      amount: roundCurrency(pensionAmount),
      description: `Pension Fund Contribution (${percentage}%)`,
      isPercentage: true,
      percentageRate: percentage,
      isStatutory: false, // Contractual, not statutory
    });
  }

  // --- FIXED: SDL Notification ---
  warnings.push(
    "ℹ️ SDL: Skills Development Levy (1% of gross) is employer responsibility.",
  );
  warnings.push("   Amount: R" + roundCurrency(grossAmount * 0.01).toFixed(2));

  // --- NON-STATUTORY DEDUCTIONS ---

  // 3. Uniform/PPE
  if (hrSettings.uniformPPEEnabled) {
    const uniformCost = 0;
    if (uniformCost > 0) {
      const amount = Math.min(
        uniformCost,
        hrSettings.uniformPPEMaxDeduction || 500,
      );
      addNonStatutoryDeduction({
        type: "UNIFORM_PPE",
        amount,
        description: "Uniform/PPE",
        isPercentage: false,
        isStatutory: false,
      });
    }
  }

  // 4. Damage/Loss
  if (hrSettings.damageLossEnabled) {
    const maxDamage =
      (grossAmount * (hrSettings.damageLossMaxPercentage || 25)) / 100;
    const actualDamage = 0;
    if (actualDamage > 0) {
      addNonStatutoryDeduction({
        type: "DAMAGE_LOSS",
        amount: Math.min(actualDamage, maxDamage),
        description: "Damage/Loss",
        isPercentage: false,
        isStatutory: false,
      });
    }
  }

  // 5. Overpayment
  if (hrSettings.overpaymentEnabled) {
    const maxRecovery =
      (grossAmount * (hrSettings.overpaymentMaxPercentage || 25)) / 100;
    const balance = 0;
    if (balance > 0) {
      addNonStatutoryDeduction({
        type: "OVERPAYMENT",
        amount: Math.min(balance, maxRecovery),
        description: "Overpayment Recovery",
        isPercentage: false,
        isStatutory: false,
      });
    }
  }

  // 6. Loans
  if (hrSettings.loanRepaymentEnabled && existingLoans > 0) {
    const maxLoanRepayment = grossAmount * 0.1;
    const amount = Math.min(existingLoans, maxLoanRepayment);
    addNonStatutoryDeduction({
      type: "LOAN_REPAYMENT",
      amount,
      description: "Loan Repayment",
      isPercentage: false,
      isStatutory: false,
    });
  }

  // 7. Funeral
  if (hrSettings.funeralBenefitEnabled) {
    addNonStatutoryDeduction({
      type: "FUNERAL_BENEFIT",
      amount: hrSettings.funeralBenefitAmount || 100,
      description: "Funeral Benefit",
      isPercentage: false,
      isStatutory: false,
    });
  }

  // 8. Union
  if (hrSettings.tradeUnionEnabled) {
    addNonStatutoryDeduction({
      type: "TRADE_UNION",
      amount: hrSettings.tradeUnionAmount || 50,
      description: "Trade Union Fees",
      isPercentage: false,
      isStatutory: false,
    });
  }

  // 9. Insurance
  if (hrSettings.insuranceEnabled) {
    const percentage = hrSettings.insurancePercentage || 0.5;
    const amount = (grossAmount * percentage) / 100;
    addNonStatutoryDeduction({
      type: "INSURANCE",
      amount,
      description: `Insurance (${percentage}%)`,
      isPercentage: true,
      percentageRate: percentage,
      isStatutory: false,
    });
  }

  // 10. Guarantee Fund
  if (hrSettings.guaranteeFundEnabled) {
    addNonStatutoryDeduction({
      type: "GUARANTEE_FUND",
      amount: hrSettings.guaranteeFundAmount || 20,
      description: "Guarantee Fund",
      isPercentage: false,
      isStatutory: false,
    });
  }

  // 11. Savings
  if (hrSettings.savingsEnabled) {
    const percentage = hrSettings.savingsMaxPercentage || 15;
    const amount = (baseAmount * percentage) / 100;
    addNonStatutoryDeduction({
      type: "SAVINGS",
      amount,
      description: `Savings (${percentage}%)`,
      isPercentage: true,
      percentageRate: percentage,
      isStatutory: false,
    });
  }

  // --- 12. PAYE Tax (Statutory) ---
  if (hrSettings.taxEnabled) {
    const taxableIncome = Math.max(0, grossAmount - pensionAmount);

    // FIXED: Pass medical credit to be applied monthly
    const taxAmount = calculateTax(
      taxableIncome,
      hrSettings.taxTableYear || "2024",
      medicalTaxCredit,
    );

    if (taxAmount > 0) {
      deductions.push({
        type: "PAYE_TAX",
        amount: roundCurrency(taxAmount),
        description: "PAYE Tax (incl. medical credit)",
        isPercentage: false,
        isStatutory: true,
      });
    }
  }

  return {
    deductions,
    nonStatutoryDeductionAmount: roundCurrency(totalNonStatutoryDeduction),
  };
}

// --- FIXED: Correct Tax Calculation ---
function calculateTax(
  monthlyTaxableIncome: number,
  taxYear: string,
  monthlyMedicalCredit: number,
): number {
  const annualIncome = monthlyTaxableIncome * 12;
  let annualTax = 0;

  // Always use under-65 rebate (as specified)
  const primaryRebate = STATUTORY_LIMITS.PRIMARY_REBATE;

  // FIXED: Remove early return - let full calculation run for audit correctness
  // Even if below threshold, medical credits should be accounted for

  // Calculate tax normally
  if (taxYear === "2024" || taxYear === "2025") {
    if (annualIncome <= 237100) {
      annualTax = annualIncome * 0.18;
    } else if (annualIncome <= 370500) {
      annualTax = 42678 + (annualIncome - 237100) * 0.26;
    } else if (annualIncome <= 512800) {
      annualTax = 77362 + (annualIncome - 370500) * 0.31;
    } else if (annualIncome <= 673000) {
      annualTax = 121475 + (annualIncome - 512800) * 0.36;
    } else if (annualIncome <= 857900) {
      annualTax = 179147 + (annualIncome - 673000) * 0.39;
    } else if (annualIncome <= 1817000) {
      annualTax = 251258 + (annualIncome - 857900) * 0.41;
    } else {
      annualTax = 644489 + (annualIncome - 1817000) * 0.45;
    }
  }

  // Apply primary rebate at ANNUAL level
  const annualTaxAfterPrimaryRebate = Math.max(0, annualTax - primaryRebate);

  // Convert to monthly BEFORE applying medical credit
  const monthlyTaxBeforeMedical = annualTaxAfterPrimaryRebate / 12;

  // FIXED: Apply medical credit at MONTHLY level
  const finalMonthlyTax = Math.max(
    0,
    monthlyTaxBeforeMedical - monthlyMedicalCredit,
  );

  return roundCurrency(finalMonthlyTax);
}

export function calculatePayroll(
  baseAmount: number,
  overtimeAmount: number,
  hrSettings: HRSettings,
  employeeType: "EMPLOYEE" | "FREELANCER" | "TRAINEE",
  performanceMetrics?: PerformanceMetrics,
  attendanceBreakdown?: any,
  existingLoans: number = 0,
  dependants: number = 0,
): PayrollCalculationResult {
  const warnings: string[] = [];

  // Tax year validation
  if (hrSettings.taxTableYear === "2025") {
    warnings.push(
      "⚠️ 2025 TAX WARNING: Using 2024 tax tables. SARS has not published 2025 rates.",
    );
    warnings.push(
      "   Update when SARS gazettes 2025 tax tables (usually February).",
    );
  }

  if (
    baseAmount < 0 ||
    overtimeAmount < 0 ||
    dependants < 0 ||
    existingLoans < 0
  ) {
    throw new Error("Payroll inputs cannot be negative");
  }

  const performanceScore = performanceMetrics
    ? calculatePerformanceScore(performanceMetrics)
    : 0;

  // 1. Calculate Deductible Pension
  let pensionAmount = 0;
  if (employeeType === "EMPLOYEE" && hrSettings.pensionEnabled) {
    const percentage = hrSettings.pensionPercentage || 7.5;
    pensionAmount = roundCurrency((baseAmount * percentage) / 100);
  }

  // 2. Bonuses
  const bonuses = calculateBonuses(
    baseAmount,
    overtimeAmount,
    hrSettings,
    employeeType,
    performanceMetrics,
    attendanceBreakdown,
  );

  const totalBonus = roundCurrency(
    bonuses.reduce((sum, b) => sum + b.amount, 0),
  );
  const grossAmount = roundCurrency(baseAmount + overtimeAmount + totalBonus);

  // 3. Medical Tax Credit
  const medicalTaxCredit = calculateMedicalTaxCredit(dependants);

  // 4. Deductions
  const { deductions, nonStatutoryDeductionAmount } = calculateDeductions(
    grossAmount,
    baseAmount,
    hrSettings,
    employeeType,
    pensionAmount,
    medicalTaxCredit,
    existingLoans,
    warnings,
  );

  const totalDeduction = roundCurrency(
    deductions.reduce((sum, d) => sum + d.amount, 0),
  );

  // 5. Net Amount
  const netAmount = roundCurrency(Math.max(0, grossAmount - totalDeduction));

  // BCEA compliance check
  const nonStatutoryPercent = nonStatutoryDeductionAmount / grossAmount;
  if (nonStatutoryPercent > STATUTORY_LIMITS.BCEA_DEDUCTION_CAP) {
    warnings.push(
      "⚠️ BCEA COMPLIANCE: Non-statutory deductions may exceed 25% limit",
    );
    warnings.push(
      `   Actual: ${(nonStatutoryPercent * 100).toFixed(2)}%, Limit: 25%`,
    );
  }

  // Minimum wage advisory
  const hoursWorked = attendanceBreakdown?.hoursWorked;
  if (hoursWorked && hoursWorked > 0) {
    const hourlyRate = netAmount / hoursWorked;
    if (hourlyRate < STATUTORY_LIMITS.MINIMUM_WAGE) {
      warnings.push(
        "⚠️ MINIMUM WAGE ADVISORY: Net hourly rate may be below minimum wage",
      );
      warnings.push(
        `   Actual: R${hourlyRate.toFixed(2)}/hr, Minimum: R${STATUTORY_LIMITS.MINIMUM_WAGE}/hr`,
      );
    }
  }

  return {
    baseAmount: roundCurrency(baseAmount),
    overtimeAmount: roundCurrency(overtimeAmount),
    bonusAmount: totalBonus,
    deductionAmount: totalDeduction,
    grossAmount,
    netAmount,
    bonuses,
    deductions,
    performanceScore,
    medicalTaxCredit,
    nonStatutoryDeductionAmount: roundCurrency(nonStatutoryDeductionAmount),
    warnings,
  };
}

// EMP201 Report Generator
export function generateEMP201Report(
  payrollResult: PayrollCalculationResult,
  employeeId: string,
  period: string,
): any {
  const uifAmount = payrollResult.deductions
    .filter((d) => d.type === "UIF")
    .reduce((sum, d) => sum + d.amount, 0);

  const payeAmount = payrollResult.deductions
    .filter((d) => d.type === "PAYE_TAX" || d.type === "TAX")
    .reduce((sum, d) => sum + d.amount, 0);

  return {
    period,
    employeeId,
    grossEarnings: payrollResult.grossAmount,
    uifEmployee: uifAmount,
    uifEmployer: uifAmount, // Employer matches employee
    paye: payeAmount,
    sdl: roundCurrency(payrollResult.grossAmount * 0.01), // 1% of gross
    employerTotal: roundCurrency(uifAmount + payrollResult.grossAmount * 0.01),
    warnings: payrollResult.warnings.filter(
      (w) =>
        w.includes("UIF") ||
        w.includes("TAX") ||
        w.includes("SARS") ||
        w.includes("SDL"),
    ),
  };
}
