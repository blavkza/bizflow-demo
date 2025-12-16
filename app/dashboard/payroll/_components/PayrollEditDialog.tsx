"use client";

import { useState, useEffect } from "react";
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

export function PayrollEditDialog({
  open,
  onOpenChange,
  employee,
  onSave,
}: PayrollEditDialogProps) {
  // Local state for items
  const [bonuses, setBonuses] = useState<BonusCalculation[]>([]);
  const [deductions, setDeductions] = useState<DeductionCalculation[]>([]);

  // State to track if an item is "active" (included in calc)
  const [activeBonuses, setActiveBonuses] = useState<boolean[]>([]);
  const [activeDeductions, setActiveDeductions] = useState<boolean[]>([]);

  // Initialize state when employee data loads
  useEffect(() => {
    if (employee) {
      setBonuses(employee.bonuses || []);
      setDeductions(employee.deductions || []);
      // Default all existing items to true initially
      setActiveBonuses(new Array(employee.bonuses?.length || 0).fill(true));
      setActiveDeductions(
        new Array(employee.deductions?.length || 0).fill(true)
      );
    }
  }, [employee]);

  // Handle Value Changes
  const handleBonusChange = (index: number, val: string) => {
    const newBonuses = [...bonuses];
    newBonuses[index] = { ...newBonuses[index], amount: parseFloat(val) || 0 };
    setBonuses(newBonuses);
  };

  const handleDeductionChange = (index: number, val: string) => {
    const newDeductions = [...deductions];
    newDeductions[index] = {
      ...newDeductions[index],
      amount: parseFloat(val) || 0,
    };
    setDeductions(newDeductions);
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
    // Filter out inactive items OR keep them but exclude from calculation?
    // For specific payroll run, we usually just want to submit the active ones.
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Payroll: {employee?.firstName} {employee?.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Bonuses */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-green-600 flex items-center justify-between">
              <span>Bonuses</span>
              <span>Total: {formatCurrency(newTotalBonus)}</span>
            </h4>
            <div className="space-y-2">
              {bonuses.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No bonuses available
                </p>
              )}
              {bonuses.map((bonus, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 border rounded-md bg-green-50/30"
                >
                  <Switch
                    checked={activeBonuses[index]}
                    onCheckedChange={(checked) => {
                      const next = [...activeBonuses];
                      next[index] = checked;
                      setActiveBonuses(next);
                    }}
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium">
                      {bonus.description || bonus.type}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {bonus.type}
                    </p>
                  </div>
                  <Input
                    type="number"
                    className="w-24 h-8 text-right"
                    value={bonus.amount}
                    onChange={(e) => handleBonusChange(index, e.target.value)}
                    disabled={!activeBonuses[index]}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-red-600 flex items-center justify-between">
              <span>Deductions</span>
              <span>Total: {formatCurrency(newTotalDeduction)}</span>
            </h4>
            <div className="space-y-2">
              {deductions.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No deductions available
                </p>
              )}
              {deductions.map((deduction, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 border rounded-md bg-red-50/30"
                >
                  <Switch
                    checked={activeDeductions[index]}
                    onCheckedChange={(checked) => {
                      const next = [...activeDeductions];
                      next[index] = checked;
                      setActiveDeductions(next);
                    }}
                  />
                  <div className="flex-1">
                    <Label className="text-sm font-medium">
                      {deduction.description || deduction.type}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {deduction.type}
                    </p>
                  </div>
                  <Input
                    type="number"
                    className="w-24 h-8 text-right"
                    value={deduction.amount}
                    onChange={(e) =>
                      handleDeductionChange(index, e.target.value)
                    }
                    disabled={!activeDeductions[index]}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Live Summary */}
          <div className="bg-slate-100 p-4 rounded-lg space-y-2 border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Base Salary:</span>
              <span>{formatCurrency(employee.baseAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overtime:</span>
              <span>{formatCurrency(employee.overtimeAmount)}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>Bonuses:</span>
              <span>+{formatCurrency(newTotalBonus)}</span>
            </div>
            <div className="flex justify-between text-sm text-red-700">
              <span>Deductions:</span>
              <span>-{formatCurrency(newTotalDeduction)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between text-lg font-bold">
              <span>Net Pay:</span>
              <span className="text-purple-700">{formatCurrency(newNet)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
