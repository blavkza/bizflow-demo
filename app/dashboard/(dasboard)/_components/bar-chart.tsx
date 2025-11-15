import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BarChartComponentProps {
  isLoading: boolean;
  data: any;
}

export function BarChartComponent({ isLoading, data }: BarChartComponentProps) {
  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const chartData =
    data.labels?.map((label: string, index: number) => ({
      name: label,
      value: data.data[index] || 0,
    })) || [];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
