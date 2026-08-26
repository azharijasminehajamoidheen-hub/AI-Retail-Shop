import React, { useState } from 'react';
import { OperationalAction, LanguageCode } from '../types';
import { 
  BellRing, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  RotateCw, 
  CheckCheck,
  Volume2,
  Sparkles
} from 'lucide-react';
import { speakVernacularText } from '../services/multilingualCopilot';

interface ActionCenterProps {
  actions: OperationalAction[];
  selectedLanguage: LanguageCode;
  onExecuteAction: (actionId: string) => void;
  onVerifyAction: (actionId: string) => void;
}

export const ActionCenter: React.FC<ActionCenterProps> = ({
  actions,
  selectedLanguage,
  onExecuteAction,
  onVerifyAction,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');

  const filteredActions = actions.filter((act) => {
    if (filter === 'PENDING') return act.status === 'PENDING' || act.status === 'IN_PROGRESS';
    if (filter === 'VERIFIED') return act.status === 'VERIFIED';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Operational Action Directives
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Converts edge camera &amp; inventory telemetry into deterministic, explainable staff workflows
          </p>
        </div>

        <div className="flex rounded-md border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              filter === 'ALL' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            ALL ({actions.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              filter === 'PENDING' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            PENDING ({actions.filter((a) => a.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setFilter('VERIFIED')}
            className={`px-3 py-1 rounded transition-all cursor-pointer ${
              filter === 'VERIFIED' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            VERIFIED ({actions.filter((a) => a.status === 'VERIFIED').length})
          </button>
        </div>
      </div>

      {/* Action Cards Grid */}
      {filteredActions.length === 0 ? (
        <div className="bg-white p-10 rounded-xl border border-slate-200 text-center space-y-2">
          <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">All Store Operations Optimal</h3>
          <p className="text-xs text-slate-500">No pending shelf restocks or queue surge alerts at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredActions.map((action) => {
            const isCritical = action.priority === 'CRITICAL';
            const isHigh = action.priority === 'HIGH';
            const isVerified = action.status === 'VERIFIED';
            const instructionText = action.translations[selectedLanguage] || action.translations.en;

            return (
              <div
                key={action.id}
                className={`bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3.5 border-l-4 ${
                  isVerified
                    ? 'border-l-emerald-500'
                    : isCritical
                    ? 'border-l-orange-500'
                    : 'border-l-blue-600'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isCritical
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {action.priority} PRIORITY
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">{action.timestamp}</span>
                  </div>

                  {/* Hardware LED link badge */}
                  <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">LED:</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        action.ledState === 'GREEN'
                          ? 'bg-emerald-500'
                          : action.ledState === 'YELLOW'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                    />
                    <span className="text-slate-700 font-bold text-[10px] font-mono">{action.ledState}</span>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-tight">{action.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{action.targetItemOrZone}</p>
                </div>

                {/* What, Why, Action Pillars */}
                <div className="space-y-2 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                    <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                      01. What Happened
                    </span>
                    <p className="text-slate-600 leading-relaxed">{action.whatHappened}</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                    <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                      02. Why It Happened
                    </span>
                    <p className="text-slate-600 leading-relaxed">{action.whyItHappened}</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                    <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                      03. Prescribed Action
                    </span>
                    <p className="text-slate-900 font-medium leading-relaxed">{action.whatShouldBeDone}</p>
                  </div>
                </div>

                {/* Multilingual Voice / Text Banner */}
                <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-100 flex items-center justify-between text-xs">
                  <div className="pr-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                      Floor Staff Audio Cue ({selectedLanguage.toUpperCase()}):
                    </span>
                    <p className="text-slate-800 font-medium text-[11px] mt-0.5">{instructionText}</p>
                  </div>
                  <button
                    onClick={() => speakVernacularText(instructionText, selectedLanguage)}
                    title="Play Audio Voice"
                    className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer shadow-xs"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Post Verification Metric Outcome */}
                {isVerified && action.postInterventionMetric && (
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-900 flex items-center space-x-1.5 uppercase text-[11px] tracking-wider">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Closed Loop Verified</span>
                      </span>
                      <p className="text-[11px] text-emerald-800 mt-1">
                        Pre: {action.preInterventionMetric.value}{action.preInterventionMetric.unit} → Post:{' '}
                        {action.postInterventionMetric.value}{action.postInterventionMetric.unit} (
                        <strong>+{action.postInterventionMetric.improvementPct}% Improvement</strong>)
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions Execution CTA */}
                {!isVerified && (
                  <div className="pt-1 flex items-center space-x-2">
                    <button
                      onClick={() => onExecuteAction(action.id)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-xs cursor-pointer transition-all flex items-center justify-center space-x-1.5 tracking-wider uppercase shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Execute &amp; Verify</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
