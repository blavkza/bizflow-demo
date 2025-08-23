import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CashFlowItem } from "./cash-flow-item";
import { formatCurrency } from "../../../../lib/formatters";

interface CashFlowCardProps {
  isLoading: boolean;
  data: any;
}

export default function CashFlowCard({ isLoading, data }: CashFlowCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Cash Flow Forecast
        </CardTitle>
        <CardDescription>Projected cash flow</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <CashFlowItem
              label="Next Month"
              amount={data?.cashFlow?.nextMonth?.amount || 0}
              progress={data?.cashFlow?.nextMonth?.progress || 0}
              formatter={formatCurrency}
            />
            <CashFlowItem
              label="Quarter End"
              amount={data?.cashFlow?.quarterEnd?.amount || 0}
              progress={data?.cashFlow?.quarterEnd?.progress || 0}
              formatter={formatCurrency}
            />
            <CashFlowItem
              label="Year End"
              amount={data?.cashFlow?.yearEnd?.amount || 0}
              progress={data?.cashFlow?.yearEnd?.progress || 0}
              formatter={formatCurrency}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
