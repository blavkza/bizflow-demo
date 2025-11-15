"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, PieChart, LineChart, AreaChart } from "lucide-react";

interface ChartSwitcherProps {
  activeChart: string;
  onChartChange: (chart: string) => void;
}

export function ChartSwitcher({
  activeChart,
  onChartChange,
}: ChartSwitcherProps) {
  const chartTypes = [
    {
      value: "invoice",
      label: "Invoices",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      value: "quotation",
      label: "Quotations",
      icon: <PieChart className="h-4 w-4" />,
    },
    {
      value: "expense",
      label: "Expenses",
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      value: "revenue",
      label: "Revenue",
      icon: <AreaChart className="h-4 w-4" />,
    },
  ];

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg">Analytics Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeChart}
          onValueChange={onChartChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            {chartTypes.map((chart) => (
              <TabsTrigger
                key={chart.value}
                value={chart.value}
                className="flex items-center gap-2"
              >
                {chart.icon}
                {chart.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Chart Display Area */}
        <div className="mt-6 h-64 bg-muted/20 rounded-lg flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {chartTypes.find((chart) => chart.value === activeChart)?.label}{" "}
              Chart
            </p>
            <p className="text-xs mt-1">
              Chart visualization would appear here
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
