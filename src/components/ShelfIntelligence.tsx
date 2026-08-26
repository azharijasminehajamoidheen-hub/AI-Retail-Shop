import React, { useState } from 'react';
import { ProductItem, ShelfZone } from '../types';
import { 
  Eye, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  ArrowUpDown, 
  SlidersHorizontal,
  Package,
  Boxes,
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { evaluateProductReconciliation } from '../services/reconciliationEngine';

interface ShelfIntelligenceProps {
  products: ProductItem[];
  shelfZones: ShelfZone[];
  onReplenish: (productId: string) => void;
  onSelectProductForReconciliation: (product: ProductItem) => void;
}

export const ShelfIntelligence: React.FC<ShelfIntelligenceProps> = ({
  products,
  shelfZones,
  onReplenish,
  onSelectProductForReconciliation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'ALL' || p.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Shelf Intelligence &amp; Facing Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Computer vision facing estimation vs recorded warehouse records • Anomaly & ghost-stock flags
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter SKU or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs focus:ring-1 focus:ring-blue-500 w-44"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-700 focus:ring-1 focus:ring-blue-500 cursor-pointer font-medium"
          >
            <option value="ALL">All Categories</option>
            <option value="Beverages">Beverages</option>
            <option value="Dairy">Dairy</option>
            <option value="Snacks">Snacks</option>
            <option value="Bakery">Bakery</option>
            <option value="Produce">Produce</option>
            <option value="Household">Household</option>
          </select>
        </div>
      </div>

      {/* Distinction Callout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Optical Facing: Visible Shelf Availability</span>
          </span>
          <p className="text-xs text-slate-500 leading-relaxed">
            Detected via edge OpenCV/YOLO bounding boxes on the front row of the physical shelf rack.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5 mb-1">
            <Boxes className="w-3.5 h-3.5 text-blue-600" />
            <span>ERP Database: Recorded Inventory</span>
          </span>
          <p className="text-xs text-slate-500 leading-relaxed">
            POS transactions minus recorded deliveries. Can diverge due to backroom holding, misplacement, or shrinkage.
          </p>
        </div>
      </div>

      {/* Shelf Inventory Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3.5">Product / SKU</th>
                <th className="px-4 py-3.5">Bay Location</th>
                <th className="px-4 py-3.5">Optical Facing</th>
                <th className="px-4 py-3.5">POS Stock</th>
                <th className="px-4 py-3.5">Backroom</th>
                <th className="px-4 py-3.5">Velocity</th>
                <th className="px-4 py-3.5">Engine Decision</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredProducts.map((product) => {
                const recon = evaluateProductReconciliation(product);
                const isCritical = product.visibleAvailabilityPct < 30;
                const isAttention = product.visibleAvailabilityPct < 60;

                return (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{product.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{product.sku}</div>
                      {product.anomalyDetected && (
                        <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200 uppercase tracking-wider">
                          Ghost Stock Anomaly
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {product.shelfLocation}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCritical ? 'bg-red-500' : isAttention ? 'bg-orange-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${product.visibleAvailabilityPct}%` }}
                          />
                        </div>
                        <span
                          className={`font-bold font-mono text-[11px] ${
                            isCritical ? 'text-red-600' : isAttention ? 'text-orange-600' : 'text-slate-800'
                          }`}
                        >
                          {product.visibleAvailabilityPct}%
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-slate-900 text-[11px]">
                      {product.recordedInventoryUnits} <span className="text-[10px] font-normal text-slate-400 font-sans">units</span>
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px]">
                      <span
                        className={
                          product.backroomStockUnits > 0
                            ? 'text-emerald-700 font-bold'
                            : 'text-slate-400'
                        }
                      >
                        {product.backroomStockUnits} <span className="text-[10px] font-normal text-slate-400 font-sans">units</span>
                      </span>
                    </td>

                    <td className="px-4 py-3 font-mono text-slate-700 text-[11px]">
                      {product.salesVelocityUnitsPerHour} /hr
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                          recon.decisionType === 'REPLENISH_SHELF'
                            ? 'bg-orange-50 text-orange-800 border border-orange-200'
                            : recon.decisionType === 'REORDER_PRODUCT'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : recon.decisionType === 'VERIFY_INVENTORY'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {recon.decisionType}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {recon.decisionType === 'REPLENISH_SHELF' && (
                          <button
                            onClick={() => onReplenish(product.id)}
                            className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all shadow-xs"
                          >
                            Restock
                          </button>
                        )}
                        <button
                          onClick={() => onSelectProductForReconciliation(product)}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center space-x-1"
                        >
                          <SlidersHorizontal className="w-2.5 h-2.5" />
                          <span>Audit</span>
                        </button>
                      </div>
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
