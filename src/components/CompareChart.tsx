import React from 'react';
import { formatDollars } from '@/utils/formatDollars';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface CompareChartProps {
  data: {
    name: string;
    yearlyMap: { [year: number]: number };
  }[];
  allYears: number[];
}

const PALETTE = ['#d4a820', '#e07030', '#5b8dd9', '#7cc67e', '#c97fd4', '#e05080', '#40c8c8'];
const MONO = "'DM Mono', monospace";
const DIM  = '#6b5a3a';
const GRID = 'rgba(255,255,255,.05)';

export default function CompareChart({ data, allYears }: CompareChartProps) {
  const datasets = data.map((entry, index) => ({
    label: entry.name,
    data: allYears.map(year => entry.yearlyMap[year] ?? 0),
    borderColor: PALETTE[index % PALETTE.length],
    backgroundColor: PALETTE[index % PALETTE.length] + '22',
    pointBackgroundColor: PALETTE[index % PALETTE.length],
    fill: false,
    tension: 0.2,
    borderWidth: 2,
    pointRadius: 4,
  }));

  const chartData = { labels: allYears, datasets };

  const options = {
    plugins: {
      legend: {
        labels: {
          color: '#f0ece0',
          font: { family: MONO, size: 11 },
          boxWidth: 12,
          padding: 16,
        },
      },
      tooltip: {
        backgroundColor: '#161210',
        borderColor: 'rgba(255,255,255,.12)',
        borderWidth: 1,
        titleColor: DIM,
        bodyColor: '#f0ece0',
        titleFont: { family: MONO, size: 10 },
        bodyFont: { family: MONO, size: 12 },
        callbacks: {
          label: (ctx: { dataset: { label: string }; parsed: { y: number } }) =>
            `${ctx.dataset.label}: $${formatDollars(ctx.parsed.y)}`,
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
    <div className="panel" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
      <div className="sec">Year-Over-Year Comparison</div>
      <Line data={chartData} options={options as object} />
    </div>
  );
}
