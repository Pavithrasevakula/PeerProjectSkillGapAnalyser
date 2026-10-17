import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function DemandChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e9e4" />
        <XAxis dataKey="skill" tick={{ fontSize: 11, fill: '#78817c' }} />
        <YAxis tick={{ fontSize: 11, fill: '#78817c' }} />
        <Tooltip
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e9e4', borderRadius: '10px', fontSize: '11px' }}
          cursor={{ fill: '#f7f8f5' }}
        />
        <Bar dataKey="count" fill="#244c43" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
