import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function ScoreGauge({ score, label }) {
  const data = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score }
  ];

  const getColor = (s) => {
    if (s >= 80) return '#22c55e'; // green-500
    if (s >= 60) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const color = getColor(score);

  return (
    <div className="relative flex flex-col items-center justify-center h-32 w-32 shrink-0">
      <div className="w-full h-full absolute inset-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="100%"
              paddingAngle={0}
              dataKey="value"
              stroke="none"
              isAnimationActive={true}
            >
              <Cell fill={color} />
              <Cell fill="#27272a" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-2 text-center pointer-events-none">
        <div className="text-3xl font-extrabold" style={{ color }}>{score}</div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-zinc-400 font-medium text-xs hidden sm:block whitespace-nowrap pointer-events-none uppercase tracking-wider">{label}</div>
    </div>
  );
}
