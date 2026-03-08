import React from 'react';
import { formatDollars } from 'mustache-historian';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface YearlyTotalsChartProps {
  yearlyData: { year: number; total: number }[];
  title?: string;
}

const MONO = "'DM Mono', monospace";
const DIM  = '#6b5a3a';
const GRID = 'rgba(255,255,255,.05)';

export default function YearlyTotalsChart({ yearlyData, title = 'Total Raised Per Year' }: YearlyTotalsChartProps) {
  const chartData = {
    labels: yearlyData.map(d => d.year),
    datasets: [{
      label: 'Total Raised',
      data: yearlyData.map(d => d.total),
      backgroundColor: 'rgba(212,168,32,.75)',
      borderColor: '#d4a820',
      borderWidth: 1,
      borderRadius: 4,
    }],
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161210',
        borderColor: 'rgba(255,255,255,.12)',
        borderWidth: 1,
        titleColor: DIM,
        bodyColor: '#f0ece0',
        titleFont: { family: MONO, size: 10 },
        bodyFont: { family: MONO, size: 12 },
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => `$${formatDollars(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: GRID },
        ticks: { color: DIM, font: { family: MONO, size: 11 } },
      },
      y: {
        grid: { color: GRID },
        ticks: {
          color: DIM,
          font: { family: MONO, size: 11 },
          callback: (value: number | string) => `$${formatDollars(Number(value))}`,
        },
      },
    },
  };

  return (
    <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
      <div className="sec">{title}</div>
      <Bar data={chartData} options={options as object} />
    </div>
  );
}
