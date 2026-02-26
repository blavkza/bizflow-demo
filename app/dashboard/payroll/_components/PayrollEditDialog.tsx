"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "../utils";
import {
  PayrollCalculationData,
  BonusCalculation,
  DeductionCalculation,
} from "@/types/payroll";

interface PayrollEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: PayrollCalculationData;
  onSave: (updatedEmployee: PayrollCalculationData) => void;
}

interface HRSettings {
  id?: string;
  // Bonus settings
  annualBonusEnabled?: boolean;
  annualBonusType?: string;
  annualBonusPercentage?: number;
  performanceBonusEnabled?: boolean;
  performanceBonusType?: string;
  profitSharingEnabled?: boolean;
  profitSharingPercentage?: number;
  thirteenthChequeEnabled?: boolean;
  spotBonusEnabled?: boolean;
  meritBonusEnabled?: boolean;
  appreciationBonusEnabled?: boolean;
  incentivePaymentEnabled?: boolean;
  recognitionAwardEnabled?: boolean;
  attendanceBonusEnabled?: boolean;
  overtimeBonusEnabled?: boolean;

  // Deduction settings
  taxEnabled?: boolean;
  uniformPPEEnabled?: boolean;
  uniformPPEMaxDeduction?: number;
  damageLossEnabled?: boolean;
  damageLossMaxPercentage?: number;
  uifEnabled?: boolean;
  uifPercentage?: number;
  pensionEnabled?: boolean;
  pensionPercentage?: number;
  medicalAidEnabled?: boolean;
  medicalAidMaxDeduction?: number;
  overpaymentEnabled?: boolean;
  overpaymentMaxPercentage?: number;
  loanRepaymentEnabled?: boolean;
  funeralBenefitEnabled?: boolean;
  funeralBenefitAmount?: number;
  tradeUnionEnabled?: boolean;
  insuranceEnabled?: boolean;
  guaranteeFundEnabled?: boolean;
  savingsEnabled?: boolean;
  savingsMaxPercentage?: number;
  disciplinaryEnabled?: boolean;
  disciplinaryMaxPercentage?: number;
  courtOrderEnabled?: boolean;

  // Any other fields
  [key: string]: any;
}

export function PayrollEditDialog({
  open,
  onOpenChange,
  employee,
  onSave,
}: PayrollEditDialogProps) {
  // Local state for items
  const [bonuses, setBonuses] = useState<BonusCalculation[]>([]);
  const [deductions, setDeductions] = useState<DeductionCalculation[]>([]);

  // HR settings state
  const [hrSettings, setHrSettings] = useState<HRSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State to track if an item is "active" (included in calc)
  const [activeBonuses, setActiveBonuses] = useState<boolean[]>([]);
  const [activeDeductions, setActiveDeductions] = useState<boolean[]>([]);

  // Calculate base amount for percentage calculations
  const baseAmount = useMemo(() => employee.baseAmount || 0, [employee]);
  const grossAmount = useMemo(
    () => (employee.baseAmount || 0) + (employee.overtimeAmount || 0),
    [employee],
  );

  // Load HR settings
  useEffect(() => {
    const loadHRSettings = async () => {
      if (!open) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/settings/hr");
        if (!response.ok) {
          throw new Error(`Failed to load HR settings: ${response.status}`);
        }
        const data = await response.json();
        console.log("HR Settings loaded:", data);
        setHrSettings(data);
      } catch (error) {
        console.error("Failed to load HR settings:", error);
        setError("Failed to load HR settings. Using default values.");
        // Use default settings if API fails
        setHrSettings(getDefaultHRSettings());
      } finally {
        setLoading(false);
      }
    };

    loadHRSettings();
  }, [open]);

  // Default HR settings if API fails
  const getDefaultHRSettings = (): HRSettings => {
    return {
      // Bonus defaults
      annualBonusEnabled: true,
      annualBonusPercentage: 100,
      performanceBonusEnabled: true,
      profitSharingEnabled: false,
      profitSharingPercentage: 10,
      thirteenthChequeEnabled: false,
      spotBonusEnabled: true,
      meritBonusEnabled: true,
      appreciationBonusEnabled: true,
      incentivePaymentEnabled: true,
      recognitionAwardEnabled: true,
      attendanceBonusEnabled: true,
      overtimeBonusEnabled: true,

      // Deduction defaults
      taxEnabled: true,
      uniformPPEEnabled: true,
      uniformPPEMaxDeduction: 500,
      damageLossEnabled: true,
      damageLossMaxPercentage: 20,
      uifEnabled: true,
      uifPercentage: 1,
      pensionEnabled: true,
      pensionPercentage: 7.5,
      medicalAidEnabled: true,
      medicalAidMaxDeduction: 2000,
      overpaymentEnabled: true,
      overpaymentMaxPercentage: 25,
      loanRepaymentEnabled: true,
      funeralBenefitEnabled: true,
      funeralBenefitAmount: 100,
      tradeUnionEnabled: false,
      insuranceEnabled: true,
      guaranteeFundEnabled: false,
      savingsEnabled: true,
      savingsMaxPercentage: 15,
      disciplinaryEnabled: true,
      disciplinaryMaxPercentage: 50,
      courtOrderEnabled: true,
    };
  };

  // Safer boolean parsing from HR settings
  const parseHRSettingsBoolean = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return value.toLowerCase() === "true" || value === "1";
    }
    if (typeof value === "number") {
      return value === 1;
    }
    return false;
  };

  // Calculate amount based on type and settings
  const calculateAmountFromSettings = (
    type: string,
    isPercentage: boolean,
    percentageRate: number | undefined,
    isDeduction: boolean = false,
  ): number => {
    if (!isPercentage || !percentageRate) return 0;

    const amount = isDeduction
      ? (grossAmount * percentageRate) / 100
      : (baseAmount * percentageRate) / 100;

    return parseFloat(amount.toFixed(2));
  };

  // Calculate fixed amounts from settings
  const getFixedAmountFromSettings = (type: string): number => {
    if (!hrSettings) return 0;

    switch (type) {
      case "FUNERAL_BENEFIT":
        return hrSettings.funeralBenefitAmount || 100;
      case "UNIFORM_PPE":
        return hrSettings.uniformPPEMaxDeduction || 500;
      case "MEDICAL_AID":
        return hrSettings.medicalAidMaxDeduction || 2000;
      default:
        return 0;
    }
  };

  // Helper function to get bonus setting value
  const getBonusSettingValue = (
    bonusType: string,
    settings: HRSettings,
  ): any => {
    switch (bonusType) {
      case "ANNUAL_BONUS":
        return settings.annualBonusEnabled;
      case "ATTENDANCE_BONUS":
        return settings.attendanceBonusEnabled;
      case "OVERTIME_BONUS":
        return settings.overtimeBonusEnabled;
      case "THIRTEENTH_CHEQUE":
        return settings.thirteenthChequeEnabled;
      case "SPOT_BONUS":
        return settings.spotBonusEnabled;
      case "MERIT_BONUS":
        return settings.meritBonusEnabled;
      case "APPRECIATION_BONUS":
        return settings.appreciationBonusEnabled;
      case "INCENTIVE_PAYMENT":
        return settings.incentivePaymentEnabled;
      case "RECOGNITION_AWARD":
        return settings.recognitionAwardEnabled;
      case "PROFIT_SHARING":
        return settings.profitSharingEnabled;
      case "PERFORMANCE_BONUS":
        return settings.performanceBonusEnabled;
      default:
        return false;
    }
  };

  // Helper function to get deduction setting value
  const getDeductionSettingValue = (
    deductionType: string,
    settings: HRSettings,
  ): any => {
    switch (deductionType) {
      case "TAX":
        return settings.taxEnabled;
      case "UIF":
        return settings.uifEnabled;
      case "PENSION":
        return settings.pensionEnabled;
      case "MEDICAL_AID":
        return settings.medicalAidEnabled;
      case "UNIFORM_PPE":
        return settings.uniformPPEEnabled;
      case "SAVINGS":
        return settings.savingsEnabled;
      case "FUNERAL_BENEFIT":
        return settings.funeralBenefitEnabled;
      case "TOOLS":
        return settings.damageLossEnabled;
      case "OVERPAYMENT":
        return settings.overpaymentEnabled;
      case "TRADE_UNION":
        return settings.tradeUnionEnabled;
      case "INSURANCE":
        return settings.insuranceEnabled;
      case "GUARANTEE_FUND":
        return settings.guaranteeFundEnabled;
      case "DISCIPLINARY":
        return settings.disciplinaryEnabled;
      case "COURT_ORDER":
        return settings.courtOrderEnabled;
      case "LOAN_REPAYMENT":
        return settings.loanRepaymentEnabled;
      default:
        return false;
    }
  };

  // Initialize state when employee data loads and HR settings are available
  useEffect(() => {
    if (employee && hrSettings) {
      console.log("HR Settings for initialization:", hrSettings);

      // Generate ALL bonuses
      const allPossibleBonuses = generateAllBonusesFromSettings(hrSettings);
      const allPossibleDeductions =
        generateAllDeductionsFromSettings(hrSettings);

      // Get employee's current bonuses/deductions
      const employeeBonuses = employee.bonuses || [];
      const employeeDeductions = employee.deductions || [];

      // Merge: Use employee's calculated values where they exist
      const mergedBonuses = mergeBonusLists(
        allPossibleBonuses,
        employeeBonuses,
        hrSettings,
      );
      const mergedDeductions = mergeDeductionLists(
        allPossibleDeductions,
        employeeDeductions,
        hrSettings,
      );

      setBonuses(mergedBonuses);
      setDeductions(mergedDeductions);

      // Initialize switches based SOLELY on HR settings
      // Switch ON only if item is enabled in HR settings
      const initialActiveBonuses = mergedBonuses.map((bonus) => {
        // Check if this bonus is enabled in HR settings
        const isEnabledInSettings = parseHRSettingsBoolean(
          getBonusSettingValue(bonus.type, hrSettings),
        );

        return isEnabledInSettings;
      });

      const initialActiveDeductions = mergedDeductions.map((deduction) => {
        // Check if this deduction is enabled in HR settings
        const isEnabledInSettings = parseHRSettingsBoolean(
          getDeductionSettingValue(deduction.type, hrSettings),
        );

        return isEnabledInSettings;
      });

      console.log("Initial bonus switches:", initialActiveBonuses);
      console.log("Initial deduction switches:", initialActiveDeductions);

      setActiveBonuses(initialActiveBonuses);
      setActiveDeductions(initialActiveDeductions);

      // Auto-calculate amounts for items that are enabled in settings
      const updatedBonuses = [...mergedBonuses];
      const updatedDeductions = [...mergedDeductions];

      initialActiveBonuses.forEach((isActive, index) => {
        if (isActive && updatedBonuses[index].amount === 0) {
          const bonus = updatedBonuses[index];
          if (bonus.isPercentage && bonus.percentageRate) {
            updatedBonuses[index].amount = calculateAmountFromSettings(
              bonus.type,
              true,
              bonus.percentageRate,
              false,
            );
          }
        }
      });

      initialActiveDeductions.forEach((isActive, index) => {
        if (isActive && updatedDeductions[index].amount === 0) {
          const deduction = updatedDeductions[index];
          if (deduction.isPercentage && deduction.percentageRate) {
            updatedDeductions[index].amount = calculateAmountFromSettings(
              deduction.type,
              true,
              deduction.percentageRate,
              true,
            );
          } else if (!deduction.isPercentage) {
            // For fixed amount deductions, use settings value
            const fixedAmount = getFixedAmountFromSettings(deduction.type);
            if (fixedAmount > 0) {
              updatedDeductions[index].amount = fixedAmount;
            }
          }
        }
      });

      if (JSON.stringify(updatedBonuses) !== JSON.stringify(mergedBonuses)) {
        setBonuses(updatedBonuses);
      }
      if (
        JSON.stringify(updatedDeductions) !== JSON.stringify(mergedDeductions)
      ) {
        setDeductions(updatedDeductions);
      }
    }
  }, [employee, hrSettings, baseAmount, grossAmount]);

  // Generate ALL bonuses from HR settings (including disabled ones)
  const generateAllBonusesFromSettings = (
    settings: HRSettings,
  ): BonusCalculation[] => {
    const bonuses: BonusCalculation[] = [];

    // Define all possible bonus types
    const bonusTypes = [
      {
        type: "ANNUAL_BONUS",
        description: "Annual Bonus",
        isPercentage: true,
        percentageRate: settings.annualBonusPercentage || 100,
      },
      {
        type: "PERFORMANCE_BONUS",
        description: "Performance Bonus",
        isPercentage: true,
        percentageRate: 10, // Default performance bonus percentage
      },
      {
        type: "ATTENDANCE_BONUS",
        description: "Attendance Bonus",
        isPercentage: false,
      },
      {
        type: "THIRTEENTH_CHEQUE",
        description: "13th Cheque",
        isPercentage: false,
      },
      {
        type: "OVERTIME_BONUS",
        description: "Overtime Bonus",
        isPercentage: false,
      },
      {
        type: "SPOT_BONUS",
        description: "Spot Bonus",
        isPercentage: false,
      },
      {
        type: "MERIT_BONUS",
        description: "Merit Bonus",
        isPercentage: false,
      },
      {
        type: "APPRECIATION_BONUS",
        description: "Appreciation Bonus",
        isPercentage: false,
      },
      {
        type: "INCENTIVE_PAYMENT",
        description: "Incentive Payment",
        isPercentage: false,
      },
      {
        type: "RECOGNITION_AWARD",
        description: "Recognition Award",
        isPercentage: false,
      },
      {
        type: "PROFIT_SHARING",
        description: "Profit Sharing",
        isPercentage: true,
        percentageRate: settings.profitSharingPercentage || 10,
      },
      {
        type: "OTHER_BONUS",
        description: "Other Bonus",
        isPercentage: false,
      },
    ];

    // Create bonus entries
    bonusTypes.forEach((bonusType) => {
      bonuses.push({
        type: bonusType.type,
        amount: 0,
        description: bonusType.description,
        isPercentage: bonusType.isPercentage,
        percentageRate: bonusType.isPercentage
          ? bonusType.percentageRate
          : undefined,
      });
    });

    return bonuses;
  };

  // Generate ALL deductions from HR settings (including disabled ones)
  const generateAllDeductionsFromSettings = (
    settings: HRSettings,
  ): DeductionCalculation[] => {
    const deductions: DeductionCalculation[] = [];

    // Define all possible deduction types
    const deductionTypes = [
      {
        type: "TAX",
        description: "Income Tax",
        isPercentage: true,
        percentageRate: 15, // Default tax rate
      },
      {
        type: "UIF",
        description: "Unemployment Insurance Fund",
        isPercentage: true,
        percentageRate: settings.uifPercentage || 1,
      },
      {
        type: "PENSION",
        description: "Pension Fund",
        isPercentage: true,
        percentageRate: settings.pensionPercentage || 7.5,
      },
      {
        type: "MEDICAL_AID",
        description: "Medical Aid",
        isPercentage: false,
      },
      {
        type: "UNIFORM_PPE",
        description: "Uniform/PPE",
        isPercentage: false,
      },
      {
        type: "LOAN_REPAYMENT",
        description: "Loan Repayment",
        isPercentage: false,
      },
      {
        type: "FUNERAL_BENEFIT",
        description: "Funeral Benefit",
        isPercentage: false,
      },
      {
        type: "SAVINGS",
        description: "Savings",
        isPercentage: true,
        percentageRate: settings.savingsMaxPercentage || 15,
      },
      {
        type: "TOOLS",
        description: "Tools",
        isPercentage: true,
        percentageRate: settings.damageLossMaxPercentage || 20,
      },
      {
        type: "OVERPAYMENT",
        description: "Overpayment Recovery",
        isPercentage: true,
        percentageRate: settings.overpaymentMaxPercentage || 25,
      },
      {
        type: "TRADE_UNION",
        description: "Trade Union Fees",
        isPercentage: false,
      },
      {
        type: "INSURANCE",
        description: "Insurance Premium",
        isPercentage: false,
      },
      {
        type: "GUARANTEE_FUND",
        description: "Guarantee Fund",
        isPercentage: false,
      },
      {
        type: "DISCIPLINARY",
        description: "Disciplinary Fine",
        isPercentage: true,
        percentageRate: settings.disciplinaryMaxPercentage || 50,
      },
      {
        type: "COURT_ORDER",
        description: "Court Order Deduction",
        isPercentage: false,
      },
      {
        type: "OTHER_DEDUCTION",
        description: "Other Deduction",
        isPercentage: false,
      },
    ];

    // Create deduction entries
    deductionTypes.forEach((deductionType) => {
      deductions.push({
        type: deductionType.type,
        amount: 0,
        description: deductionType.description,
        isPercentage: deductionType.isPercentage,
        percentageRate: deductionType.isPercentage
          ? deductionType.percentageRate
          : undefined,
      });
    });

    return deductions;
  };

  // Merge bonus lists: use employee's calculated values where they exist
  const mergeBonusLists = (
    allBonuses: BonusCalculation[],
    employeeBonuses: BonusCalculation[],
    settings: HRSettings,
  ): BonusCalculation[] => {
    return allBonuses.map((bonus) => {
      const existingBonus = employeeBonuses.find(
        (eb) => eb.type === bonus.type,
      );
      if (existingBonus) {
        return {
          ...bonus,
          amount: existingBonus.amount || 0,
          description: existingBonus.description || bonus.description,
          isPercentage: existingBonus.isPercentage,
          percentageRate: existingBonus.percentageRate,
        };
      }
      return bonus;
    });
  };

  // Merge deduction lists: use employee's calculated values where they exist
  const mergeDeductionLists = (
    allDeductions: DeductionCalculation[],
    employeeDeductions: DeductionCalculation[],
    settings: HRSettings,
  ): DeductionCalculation[] => {
    return allDeductions.map((deduction) => {
      const existingDeduction = employeeDeductions.find(
        (ed) => ed.type === deduction.type,
      );
      if (existingDeduction) {
        return {
          ...deduction,
          amount: existingDeduction.amount || 0,
          description: existingDeduction.description || deduction.description,
          isPercentage: existingDeduction.isPercentage,
          percentageRate: existingDeduction.percentageRate,
        };
      }
      return deduction;
    });
  };

  // Handle bonus switch toggle
  const handleBonusToggle = (index: number, checked: boolean) => {
    const newActiveBonuses = [...activeBonuses];
    newActiveBonuses[index] = checked;
    setActiveBonuses(newActiveBonuses);

    // If turning ON and amount is 0, calculate from settings
    if (checked && bonuses[index].amount === 0) {
      const bonus = bonuses[index];
      const newBonuses = [...bonuses];

      if (bonus.isPercentage && bonus.percentageRate) {
        // Calculate percentage-based bonus
        newBonuses[index].amount = calculateAmountFromSettings(
          bonus.type,
          true,
          bonus.percentageRate,
          false,
        );
      }
      setBonuses(newBonuses);
    }
  };

  // Handle deduction switch toggle
  const handleDeductionToggle = (index: number, checked: boolean) => {
    const newActiveDeductions = [...activeDeductions];
    newActiveDeductions[index] = checked;
    setActiveDeductions(newActiveDeductions);

    // If turning ON and amount is 0, calculate from settings
    if (checked && deductions[index].amount === 0) {
      const deduction = deductions[index];
      const newDeductions = [...deductions];

      if (deduction.isPercentage && deduction.percentageRate) {
        // Calculate percentage-based deduction
        newDeductions[index].amount = calculateAmountFromSettings(
          deduction.type,
          true,
          deduction.percentageRate,
          true,
        );
      } else if (!deduction.isPercentage) {
        // Use fixed amount from settings
        const fixedAmount = getFixedAmountFromSettings(deduction.type);
        if (fixedAmount > 0) {
          newDeductions[index].amount = fixedAmount;
        }
      }
      setDeductions(newDeductions);
    }
  };

  // Handle Value Changes
  const handleBonusChange = (index: number, val: string) => {
    const newBonuses = [...bonuses];
    const amount = parseFloat(val) || 0;
    newBonuses[index] = { ...newBonuses[index], amount };
    setBonuses(newBonuses);

    // Auto-activate bonus if amount is entered
    if (amount > 0 && !activeBonuses[index]) {
      handleBonusToggle(index, true);
    }
  };

  const handleDeductionChange = (index: number, val: string) => {
    const newDeductions = [...deductions];
    const amount = parseFloat(val) || 0;
    newDeductions[index] = {
      ...newDeductions[index],
      amount,
    };
    setDeductions(newDeductions);

    // Auto-activate deduction if amount is entered
    if (amount > 0 && !activeDeductions[index]) {
      handleDeductionToggle(index, true);
    }
  };

  // Recalculate Live Totals
  const calculateTotals = () => {
    const newTotalBonus = bonuses.reduce((sum, b, index) => {
      return activeBonuses[index] ? sum + b.amount : sum;
    }, 0);

    const newTotalDeduction = deductions.reduce((sum, d, index) => {
      return activeDeductions[index] ? sum + d.amount : sum;
    }, 0);

    // Gross = Base + Overtime + Bonus
    const newGross =
      (employee.baseAmount || 0) +
      (employee.overtimeAmount || 0) +
      newTotalBonus;
    const newNet = Math.max(0, newGross - newTotalDeduction);

    return { newTotalBonus, newTotalDeduction, newGross, newNet };
  };

  const { newTotalBonus, newTotalDeduction, newGross, newNet } =
    calculateTotals();

  const handleSave = () => {
    // Filter out inactive items
    const finalBonuses = bonuses.filter((_, i) => activeBonuses[i]);
    const finalDeductions = deductions.filter((_, i) => activeDeductions[i]);

    const updatedEmployee = {
      ...employee,
      bonuses: finalBonuses,
      deductions: finalDeductions,
      bonusAmount: newTotalBonus,
      deductionAmount: newTotalDeduction,
      amount: newGross,
      totalAmount: newGross,
      netAmount: newNet,
    };

    onSave(updatedEmployee);
  };

  // Check if bonus type is enabled in HR settings
  const isBonusEnabledInSettings = (bonusType: string): boolean => {
    if (!hrSettings) return false;

    const value = getBonusSettingValue(bonusType, hrSettings);
    return parseHRSettingsBoolean(value);
  };

  // Check if deduction type is enabled in HR settings
  const isDeductionEnabledInSettings = (deductionType: string): boolean => {
    if (!hrSettings) return false;

    const value = getDeductionSettingValue(deductionType, hrSettings);
    return parseHRSettingsBoolean(value);
  };

  // Get badge color based on whether the item is enabled in HR settings
  const getBonusStatusBadge = (bonusType: string) => {
    const isEnabled = isBonusEnabledInSettings(bonusType);
    return (
      <Badge
        variant={isEnabled ? "default" : "outline"}
        className={
          isEnabled
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
        }
      >
        {isEnabled ? "Enabled" : "Disabled"}
      </Badge>
    );
  };

  const getDeductionStatusBadge = (deductionType: string) => {
    const isEnabled = isDeductionEnabledInSettings(deductionType);
    return (
      <Badge
        variant={isEnabled ? "default" : "outline"}
        className={
          isEnabled
            ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900"
            : "bg-gray-100 text-gray-600 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800"
        }
      >
        {isEnabled ? "Enabled" : "Disabled"}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="dark:text-gray-100">
            Edit Payroll: {employee?.firstName} {employee?.lastName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Switches are ON only for items enabled in HR settings. Amounts are
            auto-calculated when switches are turned ON.
          </p>
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-200 p-2 rounded text-sm">
              ⚠️ {error}
            </div>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-muted-foreground dark:text-gray-400">
              Loading HR settings...
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Salary Info */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded text-sm">
              <div className="flex justify-between  ">
                <span>Base Salary: {formatCurrency(baseAmount)}</span>
                <span>Gross Salary: {formatCurrency(grossAmount)}</span>
              </div>
            </div>

            {/* Bonuses */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-lg text-green-600 dark:text-green-400">
                  Bonuses
                </h4>
                <span className="text-sm font-medium ">
                  Total: {formatCurrency(newTotalBonus)}
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto p-1">
                {bonuses.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No bonuses available
                  </p>
                ) : (
                  bonuses.map((bonus, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 border rounded-md dark:border-gray-700 ${
                        activeBonuses[index]
                          ? "bg-green-50 border-green-200 dark:bg-green-900/30 dark:border-green-800"
                          : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                      } ${!isBonusEnabledInSettings(bonus.type) ? "opacity-75" : ""}`}
                    >
                      <Switch
                        checked={activeBonuses[index] || false}
                        onCheckedChange={(checked) =>
                          handleBonusToggle(index, checked)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium ">
                              {bonus.description}
                            </Label>
                            {getBonusStatusBadge(bonus.type)}
                          </div>
                          <span className="text-xs  font-medium">
                            {bonus.type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs  ">
                          {bonus.isPercentage && bonus.percentageRate ? (
                            <span>
                              {bonus.percentageRate}% of base salary
                              {activeBonuses[index] && bonus.amount > 0 && (
                                <span className="ml-2 text-green-600 dark:text-green-400 font-medium">
                                  = {formatCurrency(bonus.amount)}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span>Fixed amount</span>
                          )}
                        </p>
                      </div>
                      <Input
                        type="number"
                        className="w-28 h-9 text-right dark:bg-gray-800 dark:border-gray-700 "
                        value={bonus.amount || 0}
                        onChange={(e) =>
                          handleBonusChange(index, e.target.value)
                        }
                        disabled={!activeBonuses[index]}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            <Separator className="dark:bg-gray-700" />

            {/* Deductions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-lg text-red-600 dark:text-red-400">
                  Deductions
                </h4>
                <span className="text-sm font-medium ">
                  Total: {formatCurrency(newTotalDeduction)}
                </span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto p-1">
                {deductions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No deductions available
                  </p>
                ) : (
                  deductions.map((deduction, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 border rounded-md dark:border-gray-700 ${
                        activeDeductions[index]
                          ? "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800"
                          : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                      } ${!isDeductionEnabledInSettings(deduction.type) ? "opacity-75" : ""}`}
                    >
                      <Switch
                        checked={activeDeductions[index] || false}
                        onCheckedChange={(checked) =>
                          handleDeductionToggle(index, checked)
                        }
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium ">
                              {deduction.description}
                            </Label>
                            {getDeductionStatusBadge(deduction.type)}
                          </div>
                          <span className="text-xs  font-medium">
                            {deduction.type.replace(/_/g, " ")}
                          </span>
                        </div>
                        <p className="text-xs  ">
                          {deduction.isPercentage &&
                          deduction.percentageRate ? (
                            <span>
                              {deduction.percentageRate}% of gross salary
                              {activeDeductions[index] &&
                                deduction.amount > 0 && (
                                  <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                                    = {formatCurrency(deduction.amount)}
                                  </span>
                                )}
                            </span>
                          ) : (
                            <span>
                              Fixed amount
                              {deduction.type === "FUNERAL_BENEFIT" &&
                                hrSettings?.funeralBenefitAmount && (
                                  <span>
                                    {" "}
                                    (Default:{" "}
                                    {formatCurrency(
                                      hrSettings.funeralBenefitAmount,
                                    )}
                                    )
                                  </span>
                                )}
                              {deduction.type === "UNIFORM_PPE" &&
                                hrSettings?.uniformPPEMaxDeduction && (
                                  <span>
                                    {" "}
                                    (Max:{" "}
                                    {formatCurrency(
                                      hrSettings.uniformPPEMaxDeduction,
                                    )}
                                    )
                                  </span>
                                )}
                              {deduction.type === "MEDICAL_AID" &&
                                hrSettings?.medicalAidMaxDeduction && (
                                  <span>
                                    {" "}
                                    (Max:{" "}
                                    {formatCurrency(
                                      hrSettings.medicalAidMaxDeduction,
                                    )}
                                    )
                                  </span>
                                )}
                            </span>
                          )}
                        </p>
                      </div>
                      <Input
                        type="number"
                        className="w-28 h-9 text-right dark:bg-gray-800 dark:border-gray-700 "
                        value={deduction.amount || 0}
                        onChange={(e) =>
                          handleDeductionChange(index, e.target.value)
                        }
                        disabled={!activeDeductions[index]}
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Live Summary */}
            <div className="bg-slate-100 dark:bg-gray-800 p-4 rounded-lg space-y-2 border dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground dark:text-gray-400">
                  Base Salary:
                </span>
                <span className="">{formatCurrency(employee.baseAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground dark:text-gray-400">
                  Overtime:
                </span>
                <span className="">
                  {formatCurrency(employee.overtimeAmount)}
                </span>
              </div>
              <div className="flex justify-between text-sm text-green-700 dark:text-green-400">
                <span>Bonuses:</span>
                <span>+{formatCurrency(newTotalBonus)}</span>
              </div>
              <div className="flex justify-between text-sm text-red-700 dark:text-red-400">
                <span>Deductions:</span>
                <span>-{formatCurrency(newTotalDeduction)}</span>
              </div>
              <Separator className="my-2 dark:bg-gray-700" />
              <div className="flex justify-between text-lg font-bold">
                <span className="">Net Pay:</span>
                <span className="text-purple-700 dark:text-purple-400">
                  {formatCurrency(newNet)}
                </span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="dark:border-gray-700  dark:hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
