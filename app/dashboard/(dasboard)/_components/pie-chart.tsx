import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface PieChartComponentProps {
  isLoading: boolean;
  data: any;
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

export function PieChartComponent({ isLoading, data }: PieChartComponentProps) {
  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const chartData =
    data.categories?.map((category: string, index: number) => ({
      name: category,
      value: data.data[index] || 0,
    })) || [];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) =>
            `${name} (${(percent * 100).toFixed(0)}%)`
          }
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
