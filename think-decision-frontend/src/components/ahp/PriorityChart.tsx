import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Props {
  data: Record<string, number>;
}

export function PriorityChart({ data }: Props) {
  const chartData = Object.entries(data).map(([id, value]) => ({
    name: `Alt ${id.slice(0, 8)}`,
    value: parseFloat((value * 100).toFixed(2)),
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)}%`} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0" }} />
        <Bar dataKey="value" fill="#4F46E5" radius={[0, 8, 8, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
