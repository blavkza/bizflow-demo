import { Decimal } from "@prisma/client/runtime/library";

export interface OvertimeCalculation {
  regularHours: number;
  overtimeHours: number;
  overtimeAmount: number;
  totalAmount: number;
  dailyRate: number;
  overtimeFixedRate: number;
}

export function calculateOvertime(
  regularHours: number | Decimal | null,
  overtimeHours: number | Decimal | null,
  dailySalary: number | Decimal, // Changed from monthly to daily
  overtimeFixedRate: number = 50 // Fixed amount per hour (e.g., R50)
): OvertimeCalculation {
  // Convert to numbers safely
  const regHours = regularHours ? Number(regularHours) : 0;
  const ovtHours = overtimeHours ? Number(overtimeHours) : 0;
  const dailyRate = Number(dailySalary);

  // Calculate hourly rate from daily rate (for regular hours)
  const hourlyRate = dailyRate / 8; // Assuming 8-hour work day

  // Calculate amounts - SIMPLE FIXED RATE CALCULATION
  const regularAmount = regHours * hourlyRate;
  const overtimeAmount = ovtHours * overtimeFixedRate; // Fixed rate: hours × fixed amount
  const totalAmount = regularAmount + overtimeAmount;

  console.log("Overtime calculation:", {
    regHours,
    ovtHours,
    dailyRate,
    hourlyRate,
    regularAmount,
    overtimeAmount,
    totalAmount,
    overtimeFixedRate,
  });

  return {
    regularHours: regHours,
    overtimeHours: ovtHours,
    overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    dailyRate: dailyRate,
    overtimeFixedRate: overtimeFixedRate,
  };
}
