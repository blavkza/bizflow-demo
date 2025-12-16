"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";
import { formatCurrency } from "../utils";
import { PayrollEditDialog } from "./PayrollEditDialog";
import { PayrollCalculationData } from "@/types/payroll";

interface PayrollReviewTableProps {
  employees: PayrollCalculationData[];
  selectedIds: Set<string>;
  onToggleSelection: (id: string, checked: boolean) => void;
  onToggleAll: (checked: boolean) => void;
  onUpdateEmployee: (updatedEmployee: PayrollCalculationData) => void;
}

export function PayrollReviewTable({
  employees,
  selectedIds,
  onToggleSelection,
  onToggleAll,
  onUpdateEmployee,
}: PayrollReviewTableProps) {
  const [editingEmployee, setEditingEmployee] =
    useState<PayrollCalculationData | null>(null);

  const allSelected =
    employees.length > 0 && selectedIds.size === employees.length;
  const isIndeterminate =
    selectedIds.size > 0 && selectedIds.size < employees.length;

  return (
    <>
      <div className="rounded-md border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px] pl-4">
                <Checkbox
                  checked={
                    allSelected || (isIndeterminate ? "indeterminate" : false)
                  }
                  onCheckedChange={(checked) => onToggleAll(!!checked)}
                />
              </TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Gross Pay</TableHead>
              <TableHead className="text-right">Bonuses</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Pay</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center h-24 text-muted-foreground"
                >
                  No employees found matching filter.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => {
                const isSelected = selectedIds.has(emp.id);
                return (
                  <TableRow
                    key={emp.id}
                    className={isSelected ? "bg-blue-50/30" : "opacity-60"}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          onToggleSelection(emp.id, !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">
                        {emp.firstName} {emp.lastName}
                      </div>
                      {emp.isFreelancer && (
                        <span className="text-[10px] text-blue-600 font-medium">
                          Freelancer
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {emp.department?.name || "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(emp.amount)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-green-600">
                      {emp.bonusAmount > 0
                        ? `+${formatCurrency(emp.bonusAmount)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-red-600">
                      {emp.deductionAmount > 0
                        ? `-${formatCurrency(emp.deductionAmount)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      {formatCurrency(emp.netAmount)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        type="button"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-100"
                        onClick={() => setEditingEmployee(emp)}
                        disabled={!isSelected}
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editingEmployee && (
        <PayrollEditDialog
          open={!!editingEmployee}
          onOpenChange={(open) => !open && setEditingEmployee(null)}
          employee={editingEmployee}
          onSave={(updated) => {
            onUpdateEmployee(updated);
            setEditingEmployee(null);
          }}
        />
      )}
    </>
  );
}
