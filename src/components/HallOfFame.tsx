import React from 'react';
import { formatDollars } from '@/utils/formatDollars';

interface Record {
  firstName: string;
  lastName: string;
  totalDollars: number;
}

interface HallOfFameProps {
  data: Record[];
}

export default function HallOfFame({ data }: HallOfFameProps) {
  const top10 = [...data].sort((a, b) => b.totalDollars - a.totalDollars).slice(0, 10);

  return (
    <div className="my-8">
      <h2 className="text-xl font-semibold mb-2">Lifetime Hall of Fame (Top 10)</h2>
      <table className="border-collapse border border-gray-400 w-full">
        <thead>
          <tr>
            <th className="border p-2">Rank</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Total Raised</th>
          </tr>
        </thead>
        <tbody>
          {top10.map((row, idx) => (
            <tr key={idx}>
              <td className="border p-2">{idx + 1}</td>
              <td className="border p-2">{row.firstName} {row.lastName}</td>
              <td className="border p-2">${formatDollars(row.totalDollars)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
