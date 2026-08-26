import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { BarChart3, TrendingUp, Users, Eye, CheckCircle2 } from 'lucide-react';
import { ProductItem } from '../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsChartsProps {
  products: ProductItem[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ products }) => {
  // 1. Hourly Footfall Data
  const footfallData = {
    labels: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM'],
    datasets: [
      {
        label: 'Shopper Footfall (cust/hr)',
        data: [18, 35, 62, 85, 78, 45, 52, 68, 112, 125, 95, 42],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1.5,
        borderRadius: 4,
      },
    ],
  };

  // 2. Queue Trends: Actual vs ML Prediction
  const queueTrendsData = {
    labels: ['11:00', '11:15', '11:30', '11:45', '12:00', '12:15', '12:30', '12:45', '13:00'],
    datasets: [
      {
        label: 'Actual Queue (Customers)',
        data: [2, 3, 5, 8, 7, 3, 4, 6, 2],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'ML Model Predicted Queue',
        data: [3, 4, 6, 9, 8, 4, 5, 7, 3],
        borderColor: 'rgb(59, 130, 246)',
        borderDash: [5, 5],
        tension: 0.3,
        fill: false,
      },
    ],
  };

  // 3. Category Availability
  const categoryMap: { [cat: string]: { total: number; count: number } } = {};
  products.forEach((p) => {
    if (!categoryMap[p.category]) categoryMap[p.category] = { total: 0, count: 0 };
    categoryMap[p.category].total += p.visibleAvailabilityPct;
    categoryMap[p.category].count += 1;
  });

  const categories = Object.keys(categoryMap);
  const avgCategoryAvailabilities = categories.map(
    (c) => Math.round(categoryMap[c].total / categoryMap[c].count)
  );

  const categoryChartData = {
    labels: categories,
    datasets: [
      {
        label: 'Avg Visible Availability %',
        data: avgCategoryAvailabilities,
        backgroundColor: [
          'rgba(59, 130, 246, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(245, 158, 11, 0.75)',
          'rgba(239, 68, 68, 0.75)',
          'rgba(139, 92, 246, 0.75)',
          'rgba(14, 165, 233, 0.75)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: { size: 11, family: 'monospace' },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10, family: 'monospace' } },
      },
      x: {
        grid: { color: '#f1f5f9' },
        ticks: { font: { size: 10, family: 'monospace' } },
      },
    },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Store Retail Analytics &amp; Operational Trends
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Aggregated edge intelligence • Queue forecasting validation • Category shelf facing distribution
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Footfall Chart */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Hourly Shopper Footfall Traffic</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Camera Entry ROI Counter</span>
          </div>
          <div className="h-56">
            <Bar data={footfallData} options={chartOptions} />
          </div>
        </div>

        {/* Queue actual vs predicted */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4 text-rose-600" />
              <span>Queue Length: Actual vs ML Regression Forecast</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">15m Interval Comparison</span>
          </div>
          <div className="h-56">
            <Line data={queueTrendsData} options={chartOptions} />
          </div>
        </div>

        {/* Category Facing Health */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Shelf Facing Health by Category</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Target &gt; 80%</span>
          </div>
          <div className="h-56">
            <Bar
              data={categoryChartData}
              options={{
                ...chartOptions,
                plugins: { ...chartOptions.plugins, legend: { display: false } },
              }}
            />
          </div>
        </div>

        {/* Intervention Improvement Distribution */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Verification Metric Distribution</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Closed Loop Gains</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Shelf Recovery</span>
              <p className="text-2xl font-bold text-emerald-600 font-mono tracking-tight">+68.4%</p>
              <span className="text-[10px] text-slate-500 block">Within 6 mins of alert</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Avg Queue Relief</span>
              <p className="text-2xl font-bold text-blue-600 font-mono tracking-tight">-75.0%</p>
              <span className="text-[10px] text-slate-500 block">Following counter dispatch</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ghost Stock Flagged</span>
              <p className="text-2xl font-bold text-purple-600 font-mono tracking-tight">100%</p>
              <span className="text-[10px] text-slate-500 block">Reconciled vs POS count</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Staff Adoption Rate</span>
              <p className="text-2xl font-bold text-amber-600 font-mono tracking-tight">92.0%</p>
              <span className="text-[10px] text-slate-500 block">Vernacular voice prompts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
