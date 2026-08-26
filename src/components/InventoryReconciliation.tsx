import React, { useState } from 'react';
import { ProductItem } from '../types';
import { 
  SlidersHorizontal, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCw, 
  ArrowRight, 
  Layers, 
  Boxes, 
  TrendingUp, 
  Warehouse,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';
import { evaluateProductReconciliation, ReconciliationResult } from '../services/reconciliationEngine';

interface InventoryReconciliationProps {
  products: ProductItem[];
  onUpdateProduct: (updated: ProductItem) => void;
  onSelectAction?: (result: ReconciliationResult) => void;
}

export const InventoryReconciliation: React.FC<InventoryReconciliationProps> = ({
  products,
  onUpdateProduct,
  onSelectAction,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || 'prod-001');

  const currentProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const reconciliation = evaluateProductReconciliation(currentProduct);

  const handleParamChange = (field: keyof ProductItem, value: number) => {
    onUpdateProduct({
      ...currentProduct,
      [field]: value,
    });
  };

  const handleScenarioPreset = (scenario: 'REPLENISH' | 'REORDER' | 'GHOST_STOCK' | 'OPTIMAL') => {
    if (scenario === 'REPLENISH') {
      onUpdateProduct({
        ...currentProduct,
        visibleAvailabilityPct: 15,
        recordedInventoryUnits: 55,
        backroomStockUnits: 35,
        salesVelocityUnitsPerHour: 20,
      });
    } else if (scenario === 'REORDER') {
      onUpdateProduct({
        ...currentProduct,
        visibleAvailabilityPct: 10,
        recordedInventoryUnits: 4,
        backroomStockUnits: 0,
        salesVelocityUnitsPerHour: 18,
      });
    } else if (scenario === 'GHOST_STOCK') {
      onUpdateProduct({
        ...currentProduct,
        visibleAvailabilityPct: 12,
        recordedInventoryUnits: 65,
        backroomStockUnits: 0,
        salesVelocityUnitsPerHour: 6,
      });
    } else if (scenario === 'OPTIMAL') {
      onUpdateProduct({
        ...currentProduct,
        visibleAvailabilityPct: 90,
        recordedInventoryUnits: 80,
        backroomStockUnits: 40,
        salesVelocityUnitsPerHour: 10,
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Product Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              4-Parameter Inventory Reconciliation Engine
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Cross-references Camera Facing + Recorded POS Stock + Sales Velocity + Backroom Warehouse Units
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select SKU:</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-slate-800 focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Preset Scenarios Playground Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center space-x-1.5 text-slate-700 font-bold uppercase text-[11px] tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Preset Simulation States:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleScenarioPreset('REPLENISH')}
            className="px-3 py-1.5 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-800 text-[11px] font-bold border border-orange-200 cursor-pointer transition-all uppercase tracking-wider"
          >
            1. Shelf Low + Stock in Back → REPLENISH
          </button>
          <button
            onClick={() => handleScenarioPreset('REORDER')}
            className="px-3 py-1.5 rounded-md bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-bold border border-red-200 cursor-pointer transition-all uppercase tracking-wider"
          >
            2. Shelf Low + Zero Stock → REORDER
          </button>
          <button
            onClick={() => handleScenarioPreset('GHOST_STOCK')}
            className="px-3 py-1.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200 cursor-pointer transition-all uppercase tracking-wider"
          >
            3. Discrepancy → GHOST AUDIT
          </button>
          <button
            onClick={() => handleScenarioPreset('OPTIMAL')}
            className="px-3 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 cursor-pointer transition-all uppercase tracking-wider"
          >
            4. Normal State → OPTIMAL
          </button>
        </div>
      </div>

      {/* Main 4-Parameter Visual Grid & Result Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 4 Interactive Parameters (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Parameter 1: Visible Shelf Availability */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    01. Visible Shelf Availability (Camera/YOLO)
                  </span>
                  <p className="text-[11px] text-slate-500">Optical shelf facing detection from edge camera</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                currentProduct.visibleAvailabilityPct < 30
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : currentProduct.visibleAvailabilityPct < 60
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {currentProduct.visibleAvailabilityPct}% ({reconciliation.shelfStatusLabel})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={currentProduct.visibleAvailabilityPct}
              onChange={(e) => handleParamChange('visibleAvailabilityPct', parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Parameter 2: Recorded Inventory Units */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    02. Recorded Inventory (POS / ERP System)
                  </span>
                  <p className="text-[11px] text-slate-500">Database recorded total inventory balance</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 uppercase tracking-wider font-mono">
                {currentProduct.recordedInventoryUnits} units ({reconciliation.inventoryStatusLabel})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="120"
              value={currentProduct.recordedInventoryUnits}
              onChange={(e) => handleParamChange('recordedInventoryUnits', parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          {/* Parameter 3: Product Sales Velocity */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    03. Sales Velocity (Run-Rate / Hour)
                  </span>
                  <p className="text-[11px] text-slate-500">Current checkout scan rate in units/hr</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider font-mono">
                {currentProduct.salesVelocityUnitsPerHour} units/hr ({reconciliation.salesRateLabel})
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={currentProduct.salesVelocityUnitsPerHour}
              onChange={(e) => handleParamChange('salesVelocityUnitsPerHour', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>

          {/* Parameter 4: Backroom Warehouse Availability */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                  <Warehouse className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                    04. Backroom Storage Stock
                  </span>
                  <p className="text-[11px] text-slate-500">Un-shelved reserve cartons in back warehouse</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider font-mono ${
                currentProduct.backroomStockUnits > 0 ? 'bg-orange-50 text-orange-800 border border-orange-200' : 'bg-slate-100 text-slate-600'
              }`}>
                {currentProduct.backroomStockUnits} units ({reconciliation.backroomStatusLabel})
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="80"
              value={currentProduct.backroomStockUnits}
              onChange={(e) => handleParamChange('backroomStockUnits', parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
            />
          </div>
        </div>

        {/* Right Output: Decision & Explainable Reasoning (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Decision Outcome Card */}
          <div className={`bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3.5 border-l-4 ${
            reconciliation.decisionType === 'REPLENISH_SHELF'
              ? 'border-l-orange-500'
              : reconciliation.decisionType === 'REORDER_PRODUCT'
              ? 'border-l-red-500'
              : reconciliation.decisionType === 'VERIFY_INVENTORY'
              ? 'border-l-purple-500'
              : 'border-l-emerald-500'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Reconciliation Output
              </span>
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-400 text-[10px] uppercase font-bold">LED:</span>
                <span className={`w-2 h-2 rounded-full ${
                  reconciliation.ledState === 'GREEN'
                    ? 'bg-emerald-500'
                    : reconciliation.ledState === 'YELLOW'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`} />
                <span className="text-slate-800 font-bold text-[10px] font-mono">{reconciliation.ledState}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">{reconciliation.decisionTitle}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-50 border border-slate-200 text-slate-800 uppercase tracking-wider font-mono">
                DECISION: {reconciliation.decisionType}
              </span>
            </div>

            {/* 3 Structured Pillars: What, Why, Action */}
            <div className="space-y-2 text-xs pt-1">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                  01. What Happened
                </span>
                <p className="text-slate-600 leading-relaxed">{reconciliation.whatHappened}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                  02. Why It Happened
                </span>
                <p className="text-slate-600 leading-relaxed">{reconciliation.whyItHappened}</p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-0.5">
                  03. Prescribed Action
                </span>
                <p className="text-slate-900 font-medium leading-relaxed">{reconciliation.whatShouldBeDone}</p>
              </div>
            </div>
          </div>

          {/* Explainable AI Philosophy Box */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-xs space-y-1.5">
            <div className="flex items-center space-x-2 text-slate-900 font-bold uppercase text-[11px] tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Hallucination Determinism</span>
            </div>
            <p className="text-slate-500 leading-relaxed text-[11px]">
              Deterministic rule engines execute sub-millisecond on edge microcontrollers without cloud latencies, ensuring reliable, auditable retail decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
