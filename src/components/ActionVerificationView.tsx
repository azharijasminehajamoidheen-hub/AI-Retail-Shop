import React from 'react';
import { VerificationRecord, OperationalAction } from '../types';
import { 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight, 
  RotateCw, 
  History, 
  ShieldCheck, 
  Layers, 
  Users, 
  CheckCheck,
  Sparkles,
  Award
} from 'lucide-react';

interface ActionVerificationViewProps {
  verifications: VerificationRecord[];
  pendingActions: OperationalAction[];
  onTriggerVerificationDemo: () => void;
}

export const ActionVerificationView: React.FC<ActionVerificationViewProps> = ({
  verifications,
  pendingActions,
  onTriggerVerificationDemo,
}) => {
  const successfulCount = verifications.filter((v) => v.isSuccessful).length;
  const overallSuccessRate = verifications.length > 0 ? Math.round((successfulCount / verifications.length) * 100) : 100;
  const avgImprovementPct =
    verifications.length > 0
      ? Math.round(verifications.reduce((acc, v) => acc + v.improvementPct, 0) / verifications.length)
      : 65;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Action Verification Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Stage 7 of 7: Closing the operational loop by measuring pre vs post intervention telemetry
          </p>
        </div>

        <button
          onClick={onTriggerVerificationDemo}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Simulate Completed Intervention</span>
        </button>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Success Rate</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{overallSuccessRate}%</p>
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
            ✓ Camera &amp; queue telemetry verified
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Avg Metric Gain</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600 font-mono tracking-tight">+{avgImprovementPct}%</p>
          <span className="text-[10px] text-slate-500 font-medium block">
            Across shelf facings &amp; queue relief
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Closed Loops</span>
            <History className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tracking-tight">{verifications.length} verified</p>
          <span className="text-[10px] text-slate-500 font-medium block">
            {pendingActions.length} actions currently awaiting verification
          </span>
        </div>
      </div>

      {/* Closed Loop Architecture Visual */}
      <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-xs space-y-1 border-l-4 border-l-emerald-600">
        <div className="flex items-center space-x-2 text-slate-900 font-bold uppercase tracking-wider text-[11px]">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Why Action Verification is the Key Differentiator:</span>
        </div>
        <p className="text-slate-500 leading-relaxed">
          Most retail analytics stop after issuing an alert. <strong>RetailPulse Edge</strong> re-polls the edge camera or queue telemetry after staff intervention (e.g. 5 minutes post-restock) to statistically verify whether shelf facings recovered and queue congestion normalized.
        </p>
      </div>

      {/* Detailed Verification History Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Verification Telemetry Audit Log
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono uppercase font-bold tracking-wider">Automated Re-poll (t+3 min)</span>
        </div>

        <div className="divide-y divide-slate-100">
          {verifications.map((record) => (
            <div key={record.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-tight">{record.actionTitle}</h4>
                  <span className="text-xs text-slate-500 font-mono">({record.targetEntity})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1 uppercase tracking-wider font-mono">
                    <CheckCheck className="w-3 h-3" />
                    <span>{record.verdict}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{record.timestamp}</span>
                </div>
              </div>

              {/* Before vs After Metric Comparison Pill */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs">
                {/* Pre-Intervention */}
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">PRE-INTERVENTION METRIC:</span>
                  <div className="text-base font-bold text-rose-600 font-mono mt-0.5">
                    {record.preMetricValue} {record.metricUnit}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Triggered at {record.timestamp}</span>
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center space-x-1.5 text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Staff Restock / Action</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                </div>

                {/* Post-Intervention */}
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">POST-INTERVENTION METRIC:</span>
                  <div className="text-base font-bold text-emerald-600 font-mono mt-0.5">
                    {record.postMetricValue} {record.metricUnit}{' '}
                    <span className="text-xs font-bold text-emerald-700">(+{record.improvementPct}%)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">Automated Camera Re-scan</span>
                </div>
              </div>

              {/* Feedback Summary */}
              <p className="text-xs text-slate-600 italic">"{record.feedbackSummary}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
