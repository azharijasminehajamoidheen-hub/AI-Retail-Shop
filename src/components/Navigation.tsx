import React from 'react';
import { 
  Eye, 
  Layers, 
  Video, 
  Store, 
  Users, 
  SlidersHorizontal, 
  BellRing, 
  Languages, 
  CheckCircle2, 
  BarChart3, 
  Cpu, 
  ShieldCheck, 
  Wifi, 
  WifiOff,
  PlayCircle,
} from 'lucide-react';
import { ViewTab, LEDColor } from '../types';

interface NavigationProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  ledState: LEDColor;
  onOpenDemoModal: () => void;
  pendingActionsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  isOfflineMode,
  onToggleOffline,
  ledState,
  onOpenDemoModal,
  pendingActionsCount,
}) => {
  const tabs: { id: ViewTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Store Console', icon: <Store className="w-3.5 h-3.5" /> },
    { id: '3d-store', label: '3D Twin', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'live-camera', label: 'Edge CV', icon: <Video className="w-3.5 h-3.5" /> },
    { id: 'shelves', label: 'Shelf Intel', icon: <Eye className="w-3.5 h-3.5" /> },
    { id: 'queues', label: 'Queue Analytics', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'reconciliation', label: 'Inventory Logic', icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
    { id: 'actions', label: 'Action Center', icon: <BellRing className="w-3.5 h-3.5" />, badge: pendingActionsCount },
    { id: 'copilot', label: 'Staff Copilot', icon: <Languages className="w-3.5 h-3.5" /> },
    { id: 'verification', label: 'Verification', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-3.5 h-3.5" /> },
    { id: 'hardware', label: 'Hardware IoT', icon: <Cpu className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      {/* Top Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-blue-600 leading-none">
                  RETAILPULSE<span className="text-slate-400 font-normal ml-1">EDGE</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.12em] mt-0.5">
                  Observe • Reconcile • Predict • Act
                </p>
              </div>
            </div>

            <div className="hidden lg:block h-6 w-[1px] bg-slate-200 mx-2" />

            <div className="hidden lg:flex items-center text-emerald-600 text-xs font-semibold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse" />
              <span>Edge Synced (42ms Latency)</span>
            </div>
          </div>

          {/* Status Badges & Quick Demo CTA */}
          <div className="flex items-center space-x-2.5">
            {/* Privacy Badge */}
            <div className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">Zero Face ID</span>
            </div>

            {/* Offline/Edge Badge */}
            <button
              onClick={onToggleOffline}
              title="Click to toggle Offline / Synced simulation"
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border cursor-pointer ${
                isOfflineMode
                  ? 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {isOfflineMode ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Offline Ready</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Cloud Connected</span>
                </>
              )}
            </button>

            {/* Live Hardware LED Status */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-medium">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">LED:</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  ledState === 'GREEN'
                    ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]'
                    : ledState === 'YELLOW'
                    ? 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]'
                    : 'bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]'
                }`}
              />
              <span
                className={`font-bold text-[10px] font-mono tracking-wider ${
                  ledState === 'GREEN'
                    ? 'text-emerald-700'
                    : ledState === 'YELLOW'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {ledState}
              </span>
            </div>

            {/* Guided Demo Button */}
            <button
              onClick={onOpenDemoModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer tracking-wider"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span>SIMULATE &amp; DEMO</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-100">
          {tabs.map((tab) => {
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-btn-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive ? 'bg-blue-600' : 'bg-slate-300'
                  }`}
                />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-rose-100 text-rose-700 border border-rose-200">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
