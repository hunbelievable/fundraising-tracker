import React from 'react';
import { formatDollars } from 'mustache-historian';

interface Row {
  positionFinished: number;
  firstName: string;
  lastName: string;
  totalDollars: number;
  top10Finishes: number;
}

interface LeaderboardProps {
  data: Row[];
}

export default function Leaderboard({ data }: LeaderboardProps) {
  return (
    <table className="border-collapse border border-gray-400 w-full">
      <thead>
        <tr>
          <th className="border p-2">Position</th>
          <th className="border p-2">Name</th>
          <th className="border p-2">Total Raised</th>
          <th className="border p-2">Top 10 Finishes</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx}>
            <td className="border p-2">{row.positionFinished}</td>
            <td className="border p-2">{row.firstName} {row.lastName}</td>
            <td className="border p-2">
              {row.totalDollars != null ? `$${formatDollars(row.totalDollars)}` : 'N/A'}
            </td>
            <td className="border p-2">{row.top10Finishes}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
