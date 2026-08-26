import React from 'react';
import { 
  Store, 
  Layers, 
  Eye, 
  Users, 
  SlidersHorizontal, 
  BellRing, 
  Languages, 
  CheckCircle2, 
  ArrowRight, 
  Activity, 
  TrendingUp, 
  PlayCircle,
  Sparkles
} from 'lucide-react';
import { ProductItem, ShelfZone, CheckoutCounter, OperationalAction, VerificationRecord, ViewTab } from '../types';

interface StoreOverviewProps {
  products: ProductItem[];
  shelfZones: ShelfZone[];
  counters: CheckoutCounter[];
  actions: OperationalAction[];
  verifications: VerificationRecord[];
  onNavigateTab: (tab: ViewTab) => void;
  onOpenDemoModal: () => void;
}

export const StoreOverview: React.FC<StoreOverviewProps> = ({
  products,
  shelfZones,
  counters,
  actions,
  verifications,
  onNavigateTab,
  onOpenDemoModal,
}) => {
  const lowStockCount = products.filter((p) => p.visibleAvailabilityPct < 30).length;
  const congestedCounters = counters.filter((c) => c.isOpen && c.currentQueue >= 6).length;
  const pendingActionsCount = actions.filter((a) => a.status === 'PENDING').length;
  const counter1 = counters.find((c) => c.id === 1);

  const stages: {
    num: number;
    title: string;
    description: string;
    icon: React.ReactNode;
    tab: ViewTab;
    status: 'ACTIVE' | 'OPTIMAL' | 'ALERT';
  }[] = [
    {
      num: 1,
      title: 'Observe',
      description: 'ESP32-CAM & CCTV edge video analytics detect shelf facings and queue counts anonymously.',
      icon: <Eye className="w-4 h-4 text-blue-600" />,
      tab: 'live-camera',
      status: 'ACTIVE',
    },
    {
      num: 2,
      title: 'Reconcile',
      description: 'Cross-references visible shelf facing with POS stock, sales rate, and backroom reserve.',
      icon: <SlidersHorizontal className="w-4 h-4 text-blue-600" />,
      tab: 'reconciliation',
      status: lowStockCount > 0 ? 'ALERT' : 'OPTIMAL',
    },
    {
      num: 3,
      title: 'Predict',
      description: 'Queuing regression forecasts customer surges before queues become excessive.',
      icon: <TrendingUp className="w-4 h-4 text-orange-600" />,
      tab: 'queues',
      status: congestedCounters > 0 ? 'ALERT' : 'OPTIMAL',
    },
    {
      num: 4,
      title: 'Decide',
      description: 'Deterministic business rules select the exact operational intervention (Restock vs Reorder vs Open Counter).',
      icon: <Activity className="w-4 h-4 text-blue-600" />,
      tab: 'actions',
      status: 'ACTIVE',
    },
    {
      num: 5,
      title: 'Explain',
      description: 'Breaks down WHAT happened, WHY it happened, and WHAT to do with zero hallucination.',
      icon: <Sparkles className="w-4 h-4 text-purple-600" />,
      tab: 'actions',
      status: 'ACTIVE',
    },
    {
      num: 6,
      title: 'Act',
      description: 'Dispatches task to floor staff in 6 vernacular languages and updates Arduino hardware LEDs.',
      icon: <Languages className="w-4 h-4 text-emerald-600" />,
      tab: 'copilot',
      status: pendingActionsCount > 0 ? 'ALERT' : 'OPTIMAL',
    },
    {
      num: 7,
      title: 'Verify',
      description: 'Automated camera re-scan measures pre vs post intervention metrics to verify operational success.',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
      tab: 'verification',
      status: 'OPTIMAL',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Clean Minimalist Top Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
              Offline-First Edge Engine
            </span>
            <span className="text-slate-400 text-xs">•</span>
            <span className="text-xs font-semibold text-slate-500">Supermarket Zone A</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Live Store Console &amp; Automation Hub
          </h1>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
            Observe • Reconcile • Predict • Decide • Explain • Act • Verify
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('3d-store')}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-md text-xs transition-all cursor-pointer tracking-wider"
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>3D TWIN VIEW</span>
          </button>

          <button
            onClick={onOpenDemoModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs shadow-xs transition-all cursor-pointer tracking-wider"
          >
            <PlayCircle className="w-3.5 h-3.5 text-white" />
            <span>SIMULATE SCENARIOS</span>
          </button>
        </div>
      </div>

      {/* 4 Clean Minimal KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Footfall & Store Health */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Store Health</p>
            <p className="text-2xl font-bold text-slate-900 font-mono">
              {lowStockCount > 0 || congestedCounters > 0 ? '78%' : '96%'}
            </p>
            <span className="text-[11px] text-slate-500 block">
              {lowStockCount > 0 ? '1 shelf facing low' : 'All zones optimal'}
            </span>
          </div>
          <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-xs">
            {lowStockCount > 0 ? 'ALERT' : '100%'}
          </div>
        </div>

        {/* Depleted Shelves */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Low Shelf Facings</p>
            <p
              className={`text-2xl font-bold font-mono ${
                lowStockCount > 0 ? 'text-orange-600' : 'text-slate-900'
              }`}
            >
              {lowStockCount} SKU
            </p>
            <span className="text-[11px] text-slate-500 block">
              {lowStockCount > 0 ? 'Coca-Cola Zero (15%)' : 'Shelves fully stocked'}
            </span>
          </div>
          <div className="text-xs text-orange-600 bg-orange-50 px-2.5 py-1 rounded font-bold border border-orange-200">
            {lowStockCount > 0 ? 'Level 2' : 'Optimal'}
          </div>
        </div>

        {/* Checkout Queue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Current Queue</p>
            <p
              className={`text-2xl font-bold font-mono ${
                counter1 && counter1.currentQueue >= 6 ? 'text-orange-600' : 'text-slate-900'
              }`}
            >
              {counter1 ? counter1.currentQueue : 0} <span className="text-xs font-normal text-slate-400 font-sans">Pers.</span>
            </p>
            <span className="text-[11px] text-slate-500 block">
              Forecast: {counter1 ? counter1.predictedQueue : 0} in 10m
            </span>
          </div>
          <div className="h-2 w-16 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${
                counter1 && counter1.currentQueue >= 6 ? 'bg-orange-500 w-[85%]' : 'bg-blue-600 w-[35%]'
              }`}
            />
          </div>
        </div>

        {/* Verification Success */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Action Success</p>
            <p className="text-2xl font-bold text-emerald-600 font-mono">
              94.8%
            </p>
            <span className="text-[11px] text-emerald-600 font-medium block">
              {verifications.length} verified loops
            </span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      </div>

      {/* 7-Stage Core Workflow Pipeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <span>7-Stage Operational Execution Pipeline</span>
          </h2>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Continuous Closed Loop</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5 pt-1">
          {stages.map((st) => (
            <button
              key={st.num}
              onClick={() => onNavigateTab(st.tab)}
              className="text-left p-3.5 rounded-lg bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold font-mono">
                    0{st.num}
                  </span>
                  <span>{st.icon}</span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 uppercase tracking-tight mt-2">{st.title}</h3>
                <p className="text-[11px] text-slate-500 leading-snug line-clamp-3 mt-1">
                  {st.description}
                </p>
              </div>

              <div className="pt-2 flex items-center text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                <span>Inspect</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Middle Grid: 3D Twin Preview & Action Directives */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3D Store Digital Twin Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-blue-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                3D Interactive Store Twin
              </h3>
            </div>
            <button
              onClick={() => onNavigateTab('3d-store')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer tracking-wider uppercase"
            >
              <span>Explore Scene</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div
            onClick={() => onNavigateTab('3d-store')}
            className="h-56 bg-slate-50 relative flex items-center justify-center cursor-pointer group hover:bg-slate-100/70 transition-colors p-4"
          >
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center mx-auto text-blue-600 shadow-xs group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Launch 3D Supermarket Digital Twin
              </p>
              <p className="text-[11px] text-slate-500">
                4 Aisles • 3 Checkout Lanes • Live Shopper Waypoints • Heatmap Overlay
              </p>
            </div>
          </div>

          <div className="h-12 bg-white border-t border-slate-100 flex items-center px-5 justify-between text-[11px]">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className="w-2.5 h-2.5 bg-orange-200 border border-orange-400 rounded-xs mr-1.5" />
                <span className="text-slate-600">Low Stock (&lt;30%)</span>
              </span>
              <span className="flex items-center">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1.5" />
                <span className="text-slate-600">Optimal Facing</span>
              </span>
            </div>
            <span className="text-slate-400 italic">Click to inspect shelves</span>
          </div>
        </div>

        {/* Action Directives & Copilot (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Active Directives */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Active Directives
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {actions.length} Pending
                </span>
              </div>

              <div className="space-y-3">
                {actions.slice(0, 2).map((act) => (
                  <div
                    key={act.id}
                    className={`p-3 rounded-r-lg border-l-4 ${
                      act.priority === 'CRITICAL'
                        ? 'bg-orange-50/70 border-orange-500'
                        : 'bg-blue-50/70 border-blue-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${act.priority === 'CRITICAL' ? 'text-orange-900' : 'text-blue-900'}`}>
                        {act.title.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{act.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-2">
                      {act.whatShouldBeDone}
                    </p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onNavigateTab('actions')}
                        className={`flex-1 py-1 text-[10px] font-bold rounded uppercase tracking-wider text-white ${
                          act.priority === 'CRITICAL' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                      >
                        Execute
                      </button>
                      <button
                        onClick={() => onNavigateTab('reconciliation')}
                        className="flex-1 py-1 border border-slate-300 text-slate-700 text-[10px] font-bold rounded uppercase tracking-wider bg-white hover:bg-slate-50"
                      >
                        Explain AI
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">All alerts verified against POS</span>
              <button
                onClick={() => onNavigateTab('actions')}
                className="font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
              >
                View All Directives →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Clean Tabular Summary matching Clean Minimalism Theme Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Live Shelf &amp; Inventory Reconciliation Matrix
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            POS • Edge CV • Sales Rate • Backroom
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-6 py-3">Product SKU / Name</th>
                <th className="px-6 py-3">Observe (Cam)</th>
                <th className="px-6 py-3">Reconcile (POS)</th>
                <th className="px-6 py-3">Sales Rate</th>
                <th className="px-6 py-3">Backroom</th>
                <th className="px-6 py-3">Decision</th>
                <th className="px-6 py-3">Closed-Loop Status</th>
              </tr>
            </thead>
            <tbody className="text-[12px] divide-y divide-slate-100">
              {products.slice(0, 4).map((p) => {
                const isCritical = p.visibleAvailabilityPct < 30;
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      <div>{p.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{p.shelfLocation}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`font-bold font-mono ${
                          isCritical ? 'text-red-500' : 'text-emerald-600'
                        }`}
                      >
                        {p.visibleAvailabilityPct}% {isCritical ? '(Low)' : '(Optimal)'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-700">
                      {p.recordedInventoryUnits} Units
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {p.salesVelocityUnitsPerHour > 15 ? 'High (Peak)' : 'Stable'}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-700">
                      {p.backroomStockUnits} Units
                    </td>
                    <td className="px-6 py-3.5">
                      {isCritical && p.backroomStockUnits > 0 ? (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded text-[10px] font-bold uppercase tracking-wider">
                          REPLENISH
                        </span>
                      ) : isCritical && p.backroomStockUnits === 0 && p.anomalyDetected ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px] font-bold uppercase tracking-wider">
                          GHOST AUDIT
                        </span>
                      ) : isCritical ? (
                        <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[10px] font-bold uppercase tracking-wider">
                          REORDER
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                          OPTIMAL
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      {p.visibleAvailabilityPct > 80 ? (
                        <span className="text-emerald-600 font-bold flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Awaiting Staff</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
