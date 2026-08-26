export type LanguageCode = 'en' | 'ta' | 'hi' | 'te' | 'kn' | 'ml';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
}

export type LEDColor = 'GREEN' | 'YELLOW' | 'RED';

export type ActionType = 
  | 'REPLENISH_SHELF'
  | 'REORDER_PRODUCT'
  | 'VERIFY_INVENTORY'
  | 'OPEN_COUNTER'
  | 'CLOSE_COUNTER'
  | 'CLEAN_AISLE'
  | 'NORMAL';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: 'Beverages' | 'Dairy' | 'Snacks' | 'Bakery' | 'Produce' | 'Household' | 'Pantry' | 'Grains';
  shelfId: string;
  shelfLocation: string;
  visibleAvailabilityPct: number; // 0 - 100% (from Camera / YOLO)
  recordedInventoryUnits: number; // POS / ERP recorded stock
  backroomStockUnits: number; // Stock in warehouse
  salesVelocityUnitsPerHour: number; // Current run rate
  minSafetyThreshold: number; // Safety threshold
  unitPrice: number;
  lastRestocked: string;
  lastScannedTime: string;
  anomalyDetected?: boolean;
  anomalyReason?: string;
}

export interface ShelfZone {
  id: string;
  name: string;
  aisle: number;
  category: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  products: ProductItem[];
  overallAvailabilityPct: number;
  trafficLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'OPTIMAL' | 'ATTENTION' | 'CRITICAL';
}

export interface CheckoutCounter {
  id: number;
  name: string;
  isOpen: boolean;
  currentQueue: number;
  predictedQueue: number;
  arrivalRatePerMin: number;
  serviceRatePerMin: number;
  avgProcessingTimeSec: number;
  staffName: string;
  congestionStatus: 'NORMAL' | 'MODERATE' | 'CONGESTED';
}

export interface CustomerTracking {
  id: string;
  x: number;
  z: number;
  targetX: number;
  targetZ: number;
  zone: string;
  dwellTimeSeconds: number;
  speed: number;
  status: 'BROWSING' | 'QUEUING' | 'CHECKING_OUT' | 'ENTERING' | 'EXITING';
  pathIndex: number;
}

export interface OperationalAction {
  id: string;
  timestamp: string;
  type?: ActionType;
  title: string;
  targetItemOrZone: string;
  whatHappened: string;
  whyItHappened: string;
  whatShouldBeDone: string;
  priority: PriorityLevel;
  ledState: LEDColor;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  assignedStaff?: string;
  translations: Record<LanguageCode, string>;
  preInterventionMetric: {
    label?: string;
    value: number;
    unit: string;
    timestamp?: string;
  };
  postInterventionMetric?: {
    label?: string;
    value: number;
    unit: string;
    improvementPct: number;
    timestamp?: string;
    verifiedAt?: string;
    isSuccessful?: boolean;
  };
}

export interface VerificationRecord {
  id: string;
  actionId: string;
  actionTitle: string;
  targetEntity: string;
  preMetricValue: number;
  postMetricValue: number;
  metricUnit: string;
  improvementPct: number;
  isSuccessful: boolean;
  timestamp: string;
  verdict: string;
  feedbackSummary: string;
}

export type VerificationLog = VerificationRecord;

export interface HardwareStatus {
  connected: boolean;
  port: string;
  baudRate: number;
  ledState: LEDColor;
  esp32CamStatus: 'ONLINE' | 'STANDBY' | 'SIMULATED';
  esp32Fps: number;
  lastHeartbeat: string;
  lastSerialMessage: string;
  rawPayload: string;
}

export interface StoreKPIs {
  totalFootfallToday: number;
  activeShoppersInStore: number;
  currentTotalQueue: number;
  predictedPeakQueue: number;
  lowStockShelvesCount: number;
  criticalStockoutsCount: number;
  pendingActionsCount: number;
  avgDwellTimeMinutes: number;
  actionSuccessRatePct: number;
  resolvedIncidentsToday: number;
}

export type ViewTab = 
  | 'overview'
  | '3d-store'
  | 'live-camera'
  | 'shelves'
  | 'queues'
  | 'reconciliation'
  | 'actions'
  | 'copilot'
  | 'verification'
  | 'analytics'
  | 'hardware';
