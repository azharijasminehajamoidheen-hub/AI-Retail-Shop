import React from 'react';
import { CheckoutCounter } from '../types';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  UserPlus, 
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { predictQueueSurge } from '../services/queuePredictionModel';

interface QueueIntelligenceProps {
  counters: CheckoutCounter[];
  totalShoppers: number;
  onOpenCounter2: () => void;
  onCloseCounter2: () => void;
  onSimulateQueueSurge: () => void;
}

export const QueueIntelligence: React.FC<QueueIntelligenceProps> = ({
  counters,
  totalShoppers,
  onOpenCounter2,
  onCloseCounter2,
  onSimulateQueueSurge,
}) => {
  const counter1 = counters.find((c) => c.id === 1) || counters[0];
  const counter2 = counters.find((c) => c.id === 2);
  const prediction = predictQueueSurge(counter1, totalShoppers);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Queue Analytics &amp; Surge Prediction
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            M/M/c Queuing Regression Model • Arrival vs Service Rate Analysis • Preemptive Counter Balancing
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onSimulateQueueSurge}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold border border-orange-200 text-xs cursor-pointer transition-all uppercase tracking-wider"
          >
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
            <span>Simulate Queue Spike</span>
          </button>
        </div>
      </div>

      {/* Surge Prediction Recommendation Banner */}
      {prediction.severity !== 'NORMAL' && (!counter2 || !counter2.isOpen) && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-xl shadow-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-orange-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-200 text-orange-900 uppercase tracking-wider">
                  Queue Congestion Forecasted
                </span>
                <span className="text-xs text-orange-800 font-mono">
                  Confidence: {Math.round(prediction.congestionProbability * 100)}%
                </span>
              </div>
              <h3 className="text-xs font-bold text-orange-950 uppercase tracking-tight mt-1">
                Recommendation: Open Checkout Counter 2
              </h3>
              <p className="text-xs text-orange-800 mt-0.5">{prediction.recommendationReason}</p>
            </div>
          </div>

          <button
            onClick={onOpenCounter2}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-md shadow-xs cursor-pointer transition-all flex items-center space-x-1.5 uppercase tracking-wider"
          >
            <UserPlus className="w-4 h-4" />
            <span>Open Counter 2</span>
          </button>
        </div>
      )}

      {/* Checkout Counter Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {counters.map((counter) => {
          const isCongested = counter.currentQueue >= 6;
          return (
            <div
              key={counter.id}
              className={`bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3 border-l-4 ${
                !counter.isOpen
                  ? 'border-l-slate-300 opacity-80'
                  : isCongested
                  ? 'border-l-orange-500'
                  : 'border-l-blue-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      counter.isOpen
                        ? isCongested
                          ? 'bg-orange-500'
                          : 'bg-emerald-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <h3 className="font-bold text-xs text-slate-900 uppercase tracking-tight">{counter.name}</h3>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    counter.isOpen
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {counter.isOpen ? 'ACTIVE' : 'STANDBY'}
                </span>
              </div>

              {/* Main Queue Counter Visual */}
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Current:</span>
                  <span className="text-xl font-bold text-slate-900 font-mono">
                    {counter.currentQueue}{' '}
                    <span className="text-xs font-normal text-slate-400 font-sans">cust</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">ML Pred (10m):</span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      counter.predictedQueue >= 8 ? 'text-orange-600' : 'text-blue-600'
                    }`}
                  >
                    {counter.predictedQueue}{' '}
                    <span className="text-xs font-normal text-slate-400 font-sans">cust</span>
                  </span>
                </div>
              </div>

              {/* Telemetry rows */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="text-[11px] text-slate-400">Arrival Rate:</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px]">{counter.arrivalRatePerMin} cust/min</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-[11px] text-slate-400">Service Rate:</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px]">{counter.serviceRatePerMin} cust/min</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-[11px] text-slate-400">Avg Scan Time:</span>
                  <span className="font-mono font-bold text-slate-800 text-[11px]">{counter.avgProcessingTimeSec}s</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-[11px] text-slate-400">Staff Assigned:</span>
                  <span className="font-semibold text-slate-800 text-[11px]">{counter.staffName}</span>
                </div>
              </div>

              {/* Counter 2 Action Toggle */}
              {counter.id === 2 && (
                <div className="pt-1">
                  {counter.isOpen ? (
                    <button
                      onClick={onCloseCounter2}
                      className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-md cursor-pointer transition-all uppercase tracking-wider"
                    >
                      Close Counter 2 (Rebalance Complete)
                    </button>
                  ) : (
                    <button
                      onClick={onOpenCounter2}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-md cursor-pointer transition-all uppercase tracking-wider shadow-xs"
                    >
                      Open Counter 2 (Dispatch Staff)
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ML Feature Weights & Transparency Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-600" />
          <h3 className="font-bold text-slate-900 uppercase text-xs tracking-widest">
            Queue Surge ML Model - Explainable Feature Weights
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Arrival-to-Service Ratio (λ/μ):</span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {prediction.mlFeatures.arrivalToServiceRatio}x
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {prediction.mlFeatures.arrivalToServiceRatio > 1.5
                ? '⚠️ Arrival volume outpaces scanner service throughput'
                : '✓ Traffic rate within normal operating parameters'}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Peak Hour Multiplier:</span>
            <p className="text-lg font-bold text-slate-900 mt-1 font-mono">
              {prediction.mlFeatures.hourlyLoadFactor}
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Historical regression factor for store shift schedules
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/70">
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">Estimated Wait Duration:</span>
            <p className="text-lg font-bold text-blue-600 mt-1 font-mono">
              ~{prediction.predictedWaitTimeMinutes} mins
            </p>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              Deterministic customer queue length × 28s average checkout pace
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
