'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', chats: 45, deploys: 12 },
  { name: 'Tue', chats: 52, deploys: 15 },
  { name: 'Wed', chats: 61, deploys: 18 },
  { name: 'Thu', chats: 48, deploys: 14 },
  { name: 'Fri', chats: 73, deploys: 21 },
  { name: 'Sat', chats: 35, deploys: 8 },
  { name: 'Sun', chats: 42, deploys: 10 },
];

export function ActivityChart() {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="chats"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="deploys"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
