import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { formatCurrency } from "../utils";

interface BonusDeductionBreakdownProps {
  bonuses: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
  deductions: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
  totalBonus: number;
  totalDeduction: number;
}

export function BonusDeductionBreakdown({
  bonuses = [],
  deductions = [],
  totalBonus = 0,
  totalDeduction = 0,
}: BonusDeductionBreakdownProps) {
  if (bonuses.length === 0 && deductions.length === 0) {
    return null;
  }

  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">Bonuses & Deductions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bonuses Section */}
        {bonuses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2 text-green-600">
                <TrendingUp className="h-4 w-4" />
                Bonuses
              </h4>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                +{formatCurrency(totalBonus)}
              </Badge>
            </div>
            <div className="space-y-1">
              {bonuses.map((bonus, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex-1">
                    <span className="font-medium">{bonus.type}</span>
                    {bonus.description && (
                      <span className="text-muted-foreground ml-2">
                        {bonus.description}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(bonus.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deductions Section */}
        {deductions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2 text-red-600">
                <TrendingDown className="h-4 w-4" />
                Deductions
              </h4>
              <Badge variant="outline" className="bg-red-50 text-red-700">
                -{formatCurrency(totalDeduction)}
              </Badge>
            </div>
            <div className="space-y-1">
              {deductions.map((deduction, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex-1">
                    <span className="font-medium">{deduction.type}</span>
                    {deduction.description && (
                      <span className="text-muted-foreground ml-2">
                        {deduction.description}
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(deduction.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {(bonuses.length > 0 || deductions.length > 0) && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Net Adjustment
              </h4>
              <span
                className={`font-bold ${
                  totalBonus - totalDeduction >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {totalBonus - totalDeduction >= 0 ? "+" : ""}
                {formatCurrency(totalBonus - totalDeduction)}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
