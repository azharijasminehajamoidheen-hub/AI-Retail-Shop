import React from 'react';
import { 
  PlayCircle, 
  RotateCcw, 
  Flame, 
  Users, 
  HelpCircle, 
  CheckCircle2, 
  Sparkles, 
  X, 
  Layers,
  ArrowRight
} from 'lucide-react';

interface DemoControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunStockDepletionDemo: () => void;
  onRunQueueSurgeDemo: () => void;
  onRunGhostStockDemo: () => void;
  onResetStoreState: () => void;
}

export const DemoControlModal: React.FC<DemoControlModalProps> = ({
  isOpen,
  onClose,
  onRunStockDepletionDemo,
  onRunQueueSurgeDemo,
  onRunGhostStockDemo,
  onResetStoreState,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-xl border border-slate-200 shadow-xl overflow-hidden space-y-4 p-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
                Guided Presentation Scenarios
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                1-Click Interactive Walkthroughs for SIH Reviewers &amp; Evaluators
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Scenarios Grid */}
        <div className="space-y-3">
          {/* Scenario 1 */}
          <div className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg border border-slate-200/70 flex items-center justify-between gap-3 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 uppercase font-mono tracking-wider border border-amber-200">
                  Scenario 1
                </span>
                <h3 className="text-xs font-bold text-slate-900">
                  Shelf Depletion → 4-Parameter Reconciliation → Restock → Verify
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Simulates Coca-Cola facing dropping to 15%. The Engine detects Backroom Stock (34 units), sets Yellow LED, sends Tamil/Hindi voice prompt to staff, and measures post-restock improvement (+68%).
              </p>
            </div>
            <button
              onClick={() => {
                onRunStockDepletionDemo();
                onClose();
              }}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] uppercase tracking-wider rounded-md shrink-0 cursor-pointer shadow-xs transition-colors"
            >
              Trigger Demo
            </button>
          </div>

          {/* Scenario 2 */}
          <div className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg border border-slate-200/70 flex items-center justify-between gap-3 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-900 uppercase font-mono tracking-wider border border-rose-200">
                  Scenario 2
                </span>
                <h3 className="text-xs font-bold text-slate-900">
                  Queue Spike → Queuing Regression Forecast → Open Counter 2 → Verify
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Simulates Counter 1 queue rising to 8 customers. ML forecasts 12 in 10 minutes (Red LED alert), dispatches staff to open Counter 2, and verifies queue dropping to 2 (-75% wait relief).
              </p>
            </div>
            <button
              onClick={() => {
                onRunQueueSurgeDemo();
                onClose();
              }}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] uppercase tracking-wider rounded-md shrink-0 cursor-pointer shadow-xs transition-colors"
            >
              Trigger Demo
            </button>
          </div>

          {/* Scenario 3 */}
          <div className="p-3.5 bg-slate-50 hover:bg-slate-100/70 rounded-lg border border-slate-200/70 flex items-center justify-between gap-3 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-900 uppercase font-mono tracking-wider border border-purple-200">
                  Scenario 3
                </span>
                <h3 className="text-xs font-bold text-slate-900">
                  Ghost Stock Discrepancy Detection (Explainable AI)
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Simulates Whole Wheat Bread: POS says 65 units, but Camera sees empty shelf and Backroom is 0. Instead of blind reordering, Engine flags "Audit / Discrepancy / Ghost Stock".
              </p>
            </div>
            <button
              onClick={() => {
                onRunGhostStockDemo();
                onClose();
              }}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] uppercase tracking-wider rounded-md shrink-0 cursor-pointer shadow-xs transition-colors"
            >
              Trigger Demo
            </button>
          </div>
        </div>

        {/* Footer & Reset Button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
          <button
            onClick={() => {
              onResetStoreState();
              onClose();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Store to Normal</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider rounded-md cursor-pointer transition-all shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
