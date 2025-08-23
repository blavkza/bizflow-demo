import { MetricCard } from "./metric-card";

interface MetricCardsProps {
  isLoading: boolean;
  data: any;
}

export default function MetricCards({ isLoading, data }: MetricCardsProps) {
  return (
    <div className="space-y-4">
      <MetricCard
        isLoading={isLoading}
        title="Invoice Collection Rate"
        value={data?.performanceMetrics?.collectionRate || 0}
        progress={data?.performanceMetrics?.collectionRate || 0}
        icon="check-circle"
        description={`Based on ${data?.performanceMetrics?.paidInvoicesCount || 0} paid out of ${data?.performanceMetrics?.invoicesLength} invoices`}
      />
      <MetricCard
        isLoading={isLoading}
        title="Expense vs Income"
        value={data?.performanceMetrics?.expenseRatio || 0}
        progress={data?.performanceMetrics?.expenseRatio || 0}
        icon="trending-up"
        description={
          (data?.performanceMetrics?.expenseRatio || 0) > 100
            ? "Expenses exceed income"
            : "Healthy ratio"
        }
      />
      <MetricCard
        isLoading={isLoading}
        title="Quotation Conversion"
        value={data?.performanceMetrics?.conversionRate || 0}
        progress={data?.performanceMetrics?.conversionRate || 0}
        icon="users"
        description="Based on latest quotations"
      />
    </div>
  );
}
