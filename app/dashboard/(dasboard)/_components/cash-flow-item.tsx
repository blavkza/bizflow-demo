import { Progress } from "@/components/ui/progress";

interface CashFlowItemProps {
  label: string;
  amount?: number;
  progress?: number;
  formatter?: (value: number) => string;
}

export function CashFlowItem({
  label,
  amount = 0,
  progress = 0,
  formatter,
}: CashFlowItemProps) {
  const formattedAmount = formatter ? formatter(amount) : amount;
  const isPositive = amount >= 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="text-sm">{label}</span>
        <span
          className={`text-sm font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
        >
          {isPositive ? "+" : ""}
          {formattedAmount}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
