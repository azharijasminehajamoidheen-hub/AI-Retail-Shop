import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ProductItem, 
  ShelfZone, 
  CheckoutCounter, 
  OperationalAction, 
  VerificationRecord, 
  LanguageCode, 
  ViewTab, 
  LEDColor 
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_SHELF_ZONES, 
  INITIAL_COUNTERS, 
  INITIAL_ACTIONS, 
  INITIAL_VERIFICATIONS 
} from './data/mockStoreData';
import { HardwareController } from './services/hardwareSimulator';
import { evaluateProductReconciliation } from './services/reconciliationEngine';

// Components
import { Navigation } from './components/Navigation';
import { StoreOverview } from './components/StoreOverview';
import { ThreeStoreView } from './components/ThreeStoreView';
import { LiveCameraView } from './components/LiveCameraView';
import { ShelfIntelligence } from './components/ShelfIntelligence';
import { QueueIntelligence } from './components/QueueIntelligence';
import { InventoryReconciliation } from './components/InventoryReconciliation';
import { ActionCenter } from './components/ActionCenter';
import { MultilingualCopilotView } from './components/MultilingualCopilotView';
import { ActionVerificationView } from './components/ActionVerificationView';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { HardwareArchitectureView } from './components/HardwareArchitectureView';
import { DemoControlModal } from './components/DemoControlModal';

export default function App() {
  // Application State
  const [currentTab, setCurrentTab] = useState<ViewTab>('overview');
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);
  const [shelfZones, setShelfZones] = useState<ShelfZone[]>(INITIAL_SHELF_ZONES);
  const [counters, setCounters] = useState<CheckoutCounter[]>(INITIAL_COUNTERS);
  const [actions, setActions] = useState<OperationalAction[]>(INITIAL_ACTIONS);
  const [verifications, setVerifications] = useState<VerificationRecord[]>(INITIAL_VERIFICATIONS);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en');
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(true); // Offline-first by default
  const [ledState, setLedState] = useState<LEDColor>('YELLOW');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);
  const [serialLogs, setSerialLogs] = useState<{ timestamp: string; direction: 'TX' | 'RX'; payload: string }[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      direction: 'RX',
      payload: '{"status":"READY","device":"ARDUINO_UNO_R3","baud":115200}',
    },
    {
      timestamp: new Date().toLocaleTimeString(),
      direction: 'TX',
      payload: '{"cmd":"SET_LED","color":"YELLOW","reason":"SHELF_REPLENISH_AISLE_1"}',
    },
  ]);

  const hardwareController = HardwareController.getInstance();

  // Sync LED changes with serial logger
  const handleSetLED = (color: LEDColor, reason: string) => {
    setLedState(color);
    hardwareController.setLED(color, reason);
    const newLog = {
      timestamp: new Date().toLocaleTimeString(),
      direction: 'TX' as const,
      payload: JSON.stringify({ cmd: 'SET_LED', color, reason }),
    };
    const ackLog = {
      timestamp: new Date().toLocaleTimeString(),
      direction: 'RX' as const,
      payload: JSON.stringify({ ack: 'OK', color, state: 'ACTIVE' }),
    };
    setSerialLogs((prev) => [newLog, ackLog, ...prev.slice(0, 30)]);
  };

  // 1. Replenish Product & Trigger Verification
  const handleReplenishProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    const preFacing = target.visibleAvailabilityPct;
    const unitsToRestock = Math.min(24, target.backroomStockUnits);
    const postFacing = 88;

    // Update Product State
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          visibleAvailabilityPct: postFacing,
          recordedInventoryUnits: p.recordedInventoryUnits,
          backroomStockUnits: Math.max(0, p.backroomStockUnits - unitsToRestock),
        };
      }
      return p;
    });
    setProducts(updatedProducts);

    // Update Shelf Zone overall availability
    setShelfZones((prev) =>
      prev.map((z) => {
        if (z.id === target.shelfId) {
          return { ...z, overallAvailabilityPct: 88 };
        }
        return z;
      })
    );

    // Mark Action as Verified
    const improvement = Math.round(((postFacing - preFacing) / preFacing) * 100);
    setActions((prev) =>
      prev.map((a) => {
        if (a.targetItemOrZone.includes(target.name) || a.id === 'act-001') {
          return {
            ...a,
            status: 'VERIFIED',
            postInterventionMetric: {
              value: postFacing,
              unit: '%',
              timestamp: new Date().toLocaleTimeString(),
              improvementPct: improvement,
            },
          };
        }
        return a;
      })
    );

    // Add Verification Log
    const newVerification: VerificationRecord = {
      id: `ver-${Date.now()}`,
      actionId: 'act-001',
      actionTitle: `Replenish ${target.name}`,
      targetEntity: `${target.name} (${target.shelfLocation})`,
      preMetricValue: preFacing,
      postMetricValue: postFacing,
      metricUnit: '% Visible Facing',
      improvementPct: improvement,
      isSuccessful: true,
      timestamp: new Date().toLocaleTimeString(),
      verdict: 'ACTION SUCCESSFUL ✓',
      feedbackSummary: `Camera re-scan verified shelf facing recovery from ${preFacing}% to ${postFacing}%. Shelf fully stocked.`,
    };
    setVerifications((prev) => [newVerification, ...prev]);

    // Set Hardware LED to GREEN
    handleSetLED('GREEN', `RESTOCK_VERIFIED_${target.name.toUpperCase()}`);

    // Trigger celebration confetti!
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  // 2. Open Counter 2 & Balance Queues
  const handleOpenCounter2 = () => {
    const counter1 = counters.find((c) => c.id === 1);
    const preQueue = counter1 ? counter1.currentQueue : 8;
    const postQueue = 2;

    // Update Counters: Open counter 2, split queues
    setCounters((prev) =>
      prev.map((c) => {
        if (c.id === 1) {
          return { ...c, currentQueue: 3, predictedQueue: 3, congestionStatus: 'NORMAL' };
        }
        if (c.id === 2) {
          return { ...c, isOpen: true, currentQueue: 2, predictedQueue: 2, congestionStatus: 'NORMAL' };
        }
        return c;
      })
    );

    // Mark Queue Action as Verified
    const reliefPct = 75;
    setActions((prev) =>
      prev.map((a) => {
        if (a.id === 'act-002' || a.title.includes('Counter 2')) {
          return {
            ...a,
            status: 'VERIFIED',
            postInterventionMetric: {
              value: postQueue,
              unit: ' cust',
              timestamp: new Date().toLocaleTimeString(),
              improvementPct: reliefPct,
            },
          };
        }
        return a;
      })
    );

    // Add Verification Log
    const newVerification: VerificationRecord = {
      id: `ver-${Date.now()}`,
      actionId: 'act-002',
      actionTitle: 'Open Checkout Counter 2',
      targetEntity: 'Checkout Lanes (Counters 1 & 2)',
      preMetricValue: preQueue,
      postMetricValue: postQueue,
      metricUnit: ' customers waiting',
      improvementPct: reliefPct,
      isSuccessful: true,
      timestamp: new Date().toLocaleTimeString(),
      verdict: 'QUEUE CONGESTION RELIEVED ✓',
      feedbackSummary: `Overhead CCTV re-scan verified queue length dropped from ${preQueue} to ${postQueue} customers following Counter 2 opening.`,
    };
    setVerifications((prev) => [newVerification, ...prev]);

    // Set Hardware LED to GREEN
    handleSetLED('GREEN', 'QUEUE_CONGESTION_RESOLVED');

    // Trigger celebration confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const handleCloseCounter2 = () => {
    setCounters((prev) =>
      prev.map((c) => {
        if (c.id === 2) {
          return { ...c, isOpen: false, currentQueue: 0, predictedQueue: 0, congestionStatus: 'NORMAL' };
        }
        return c;
      })
    );
  };

  // 3. Simulate Queue Surge
  const handleSimulateQueueSurge = () => {
    setCounters((prev) =>
      prev.map((c) => {
        if (c.id === 1) {
          return {
            ...c,
            currentQueue: 8,
            predictedQueue: 12,
            congestionStatus: 'CONGESTED',
            arrivalRatePerMin: 6.2,
          };
        }
        if (c.id === 2) {
          return { ...c, isOpen: false };
        }
        return c;
      })
    );

    // Add Action to Action Center
    const newQueueAction: OperationalAction = {
      id: `act-${Date.now()}`,
      title: 'Open Checkout Counter 2',
      targetItemOrZone: 'Checkout Zone / Counter 1 & 2',
      whatHappened: 'Counter 1 queue spiked to 8 customers. Arrival rate (6.2/min) is 2.5x service rate.',
      whyItHappened: 'Evening peak hour footfall surge causing bottle-neck at single active counter.',
      whatShouldBeDone: 'Dispatch backup cashier (Suresh K.) to immediately open Counter 2.',
      priority: 'CRITICAL',
      status: 'PENDING',
      ledState: 'RED',
      timestamp: new Date().toLocaleTimeString(),
      preInterventionMetric: {
        value: 8,
        unit: ' cust',
        timestamp: new Date().toLocaleTimeString(),
      },
      translations: {
        en: 'Queue congestion predicted at Counter 1. Open Counter 2 immediately.',
        ta: 'கவுண்டர் 1 இல் வரிசை நெரிசல் கணிக்கப்பட்டுள்ளது. உடனடியாக கவுண்டர் 2 ஐ திறக்கவும்.',
        hi: 'काउंटर 1 पर कतार की भीड़ का अनुमान है। तुरंत काउंटर 2 खोलें।',
        te: 'కౌంటర్ 1 వద్ద క్యూ రద్దీ అంచనా వేయబడింది. వెంటనే కౌంటర్ 2 తెరవండి.',
        kn: 'ಕೌಂಟರ್ 1 ರಲ್ಲಿ ಸರತಿ ಸಾಲಿನ ದಟ್ಟಣೆ ಊಹಿಸಲಾಗಿದೆ. ತಕ್ಷಣ ಕೌಂಟರ್ 2 ತೆರೆಯಿರಿ.',
        ml: 'കൗണ്ടർ 1-ൽ തിരക്ക് പ്രവചിക്കപ്പെടുന്നു. ഉടൻ തന്നെ കൗണ്ടർ 2 തുറക്കുക.',
      },
    };

    setActions((prev) => [newQueueAction, ...prev]);
    handleSetLED('RED', 'QUEUE_SURGE_PREDICTED_COUNTER_1');
  };

  // 4. Guided Scenario 1: Stock Depletion
  const handleRunStockDepletionDemo = () => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === 'BEV-COKE-500') {
          return {
            ...p,
            visibleAvailabilityPct: 15,
            recordedInventoryUnits: 52,
            backroomStockUnits: 34,
            salesVelocityUnitsPerHour: 22,
          };
        }
        return p;
      })
    );
    setShelfZones((prev) =>
      prev.map((z) => (z.id === 'shelf-01' ? { ...z, overallAvailabilityPct: 22 } : z))
    );
    handleSetLED('YELLOW', 'SHELF_DEPLETION_AISLE_1_COKE');
    setCurrentTab('reconciliation');
  };

  // 5. Guided Scenario 2: Queue Surge
  const handleRunQueueSurgeDemo = () => {
    handleSimulateQueueSurge();
    setCurrentTab('queues');
  };

  // 6. Guided Scenario 3: Ghost Stock
  const handleRunGhostStockDemo = () => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.sku === 'BAK-BREAD-400') {
          return {
            ...p,
            visibleAvailabilityPct: 10,
            recordedInventoryUnits: 65,
            backroomStockUnits: 0,
            salesVelocityUnitsPerHour: 6,
            anomalyDetected: true,
          };
        }
        return p;
      })
    );
    handleSetLED('YELLOW', 'GHOST_STOCK_ANOMALY_BAKERY');
    setCurrentTab('reconciliation');
  };

  // 7. Reset Store State
  const handleResetStoreState = () => {
    setProducts(INITIAL_PRODUCTS);
    setShelfZones(INITIAL_SHELF_ZONES);
    setCounters(INITIAL_COUNTERS);
    setActions(INITIAL_ACTIONS);
    setVerifications(INITIAL_VERIFICATIONS);
    handleSetLED('YELLOW', 'STORE_RESET_BASELINE');
  };

  const pendingActionsCount = actions.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navigation
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOfflineMode={isOfflineMode}
        onToggleOffline={() => setIsOfflineMode(!isOfflineMode)}
        ledState={ledState}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
        pendingActionsCount={pendingActionsCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {currentTab === 'overview' && (
          <StoreOverview
            products={products}
            shelfZones={shelfZones}
            counters={counters}
            actions={actions}
            verifications={verifications}
            onNavigateTab={setCurrentTab}
            onOpenDemoModal={() => setIsDemoModalOpen(true)}
          />
        )}

        {currentTab === '3d-store' && (
          <ThreeStoreView
            products={products}
            shelfZones={shelfZones}
            counters={counters}
            onOpenCounter2={handleOpenCounter2}
            onReplenishProduct={handleReplenishProduct}
          />
        )}

        {currentTab === 'live-camera' && (
          <LiveCameraView
            products={products}
            onShelfLevelChange={(prodId, newPct) => {
              setProducts((prev) =>
                prev.map((p) => (p.id === prodId ? { ...p, visibleAvailabilityPct: newPct } : p))
              );
            }}
          />
        )}

        {currentTab === 'shelves' && (
          <ShelfIntelligence
            products={products}
            shelfZones={shelfZones}
            onReplenish={handleReplenishProduct}
            onSelectProductForReconciliation={(p) => setCurrentTab('reconciliation')}
          />
        )}

        {currentTab === 'queues' && (
          <QueueIntelligence
            counters={counters}
            totalShoppers={18}
            onOpenCounter2={handleOpenCounter2}
            onCloseCounter2={handleCloseCounter2}
            onSimulateQueueSurge={handleSimulateQueueSurge}
          />
        )}

        {currentTab === 'reconciliation' && (
          <InventoryReconciliation
            products={products}
            onUpdateProduct={(updated) => {
              setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
              const recon = evaluateProductReconciliation(updated);
              handleSetLED(recon.ledState, recon.decisionType);
            }}
          />
        )}

        {currentTab === 'actions' && (
          <ActionCenter
            actions={actions}
            selectedLanguage={selectedLanguage}
            onExecuteAction={(actId) => {
              const act = actions.find((a) => a.id === actId);
              if (act && act.title.includes('Counter')) {
                handleOpenCounter2();
              } else {
                handleReplenishProduct('prod-001');
              }
            }}
            onVerifyAction={(actId) => {
              setCurrentTab('verification');
            }}
          />
        )}

        {currentTab === 'copilot' && (
          <MultilingualCopilotView
            selectedLanguage={selectedLanguage}
            onLanguageChange={setSelectedLanguage}
            actions={actions}
            isOfflineMode={isOfflineMode}
          />
        )}

        {currentTab === 'verification' && (
          <ActionVerificationView
            verifications={verifications}
            pendingActions={actions.filter((a) => a.status === 'PENDING')}
            onTriggerVerificationDemo={() => handleReplenishProduct('prod-001')}
          />
        )}

        {currentTab === 'analytics' && <AnalyticsCharts products={products} />}

        {currentTab === 'hardware' && (
          <HardwareArchitectureView
            ledState={ledState}
            onSetLED={handleSetLED}
            serialLogs={serialLogs}
          />
        )}
      </main>

      {/* Guided Presentation Modal */}
      <DemoControlModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onRunStockDepletionDemo={handleRunStockDepletionDemo}
        onRunQueueSurgeDemo={handleRunQueueSurgeDemo}
        onRunGhostStockDemo={handleRunGhostStockDemo}
        onResetStoreState={handleResetStoreState}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>RetailPulse Edge</strong> • Offline-First Retail Intelligence Platform (College / SIH Benchmark)
          </span>
          <span className="text-slate-400 font-mono">
            Observe → Reconcile → Predict → Decide → Explain → Act → Verify
          </span>
        </div>
      </footer>
    </div>
  );
}
