import { ProductItem, OperationalAction, PriorityLevel, LEDColor, LanguageCode } from '../types';

export interface ReconciliationResult {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  shelfLocation: string;
  
  // 4 Core Parameters
  shelfAvailabilityPct: number;
  shelfStatusLabel: 'LOW' | 'MODERATE' | 'OPTIMAL';
  recordedInventoryUnits: number;
  inventoryStatusLabel: 'LOW' | 'NORMAL' | 'HIGH';
  salesVelocityUnitsPerHour: number;
  salesRateLabel: 'LOW' | 'NORMAL' | 'HIGH';
  backroomStockUnits: number;
  backroomStatusLabel: 'NONE' | 'LOW' | 'AVAILABLE';

  // Output Decision
  decisionType: 'REPLENISH_SHELF' | 'REORDER_PRODUCT' | 'VERIFY_INVENTORY' | 'OPTIMAL';
  decisionTitle: string;
  whatHappened: string;
  whyItHappened: string;
  whatShouldBeDone: string;
  priority: PriorityLevel;
  ledState: LEDColor;
  confidenceScore: number;
  
  // Multilingual Ready
  instructions: Record<LanguageCode, string>;
}

export function evaluateProductReconciliation(product: ProductItem): ReconciliationResult {
  const isShelfLow = product.visibleAvailabilityPct < 35;
  const isShelfModerate = product.visibleAvailabilityPct >= 35 && product.visibleAvailabilityPct < 65;
  const isInventoryLow = product.recordedInventoryUnits <= (product.minSafetyThreshold * 0.4);
  const isInventoryHigh = product.recordedInventoryUnits > (product.minSafetyThreshold * 0.8);
  const isSalesHigh = product.salesVelocityUnitsPerHour >= 15;
  const isSalesNormal = product.salesVelocityUnitsPerHour >= 8 && product.salesVelocityUnitsPerHour < 15;
  const isBackroomAvailable = product.backroomStockUnits > 0;

  const shelfStatusLabel = isShelfLow ? 'LOW' : isShelfModerate ? 'MODERATE' : 'OPTIMAL';
  const inventoryStatusLabel = isInventoryLow ? 'LOW' : isInventoryHigh ? 'HIGH' : 'NORMAL';
  const salesRateLabel = isSalesHigh ? 'HIGH' : isSalesNormal ? 'NORMAL' : 'LOW';
  const backroomStatusLabel = product.backroomStockUnits === 0 ? 'NONE' : product.backroomStockUnits < 15 ? 'LOW' : 'AVAILABLE';

  // CASE 1: Low Visible Shelf + High/Normal Recorded Stock + Stock in Backroom
  if (isShelfLow && isBackroomAvailable && product.recordedInventoryUnits > 10) {
    const unitsToMove = Math.min(product.backroomStockUnits, 24);
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      shelfLocation: product.shelfLocation,
      shelfAvailabilityPct: product.visibleAvailabilityPct,
      shelfStatusLabel,
      recordedInventoryUnits: product.recordedInventoryUnits,
      inventoryStatusLabel,
      salesVelocityUnitsPerHour: product.salesVelocityUnitsPerHour,
      salesRateLabel,
      backroomStockUnits: product.backroomStockUnits,
      backroomStatusLabel,
      decisionType: 'REPLENISH_SHELF',
      decisionTitle: `Replenish ${product.name} Shelf`,
      whatHappened: `Visible shelf facing is depleted to ${product.visibleAvailabilityPct}%, but recorded system inventory is healthy (${product.recordedInventoryUnits} units).`,
      whyItHappened: `High customer purchase velocity (${product.salesVelocityUnitsPerHour} units/hr) emptied the display, while ${product.backroomStockUnits} units remain un-shelved in the backroom.`,
      whatShouldBeDone: `Store staff should retrieve ${unitsToMove} units from Backroom Rack B and restock ${product.shelfLocation}.`,
      priority: isSalesHigh ? 'HIGH' : 'MEDIUM',
      ledState: 'YELLOW',
      confidenceScore: 0.98,
      instructions: {
        en: `Replenish ${product.name} on ${product.shelfLocation}. Retrieve ${unitsToMove} units from backroom (Available: ${product.backroomStockUnits}).`,
        ta: `${product.shelfLocation}-ல் ${product.name} அலமாரியை நிரப்பவும். பின்புற சேமிப்பிலிருந்து ${unitsToMove} பொருட்களை எடுக்கவும் (மொத்தம்: ${product.backroomStockUnits}).`,
        hi: `${product.shelfLocation} पर ${product.name} शेल्फ को फिर से भरें। बैकरूम से ${unitsToMove} यूनिट लाएं (उपलब्ध: ${product.backroomStockUnits})।`,
        te: `${product.shelfLocation} వద్ద ${product.name} షెల్ఫ్‌ను రీస్టాక్ చేయండి. బ్యాక్‌రూమ్ నుండి ${unitsToMove} యూనిట్లను తీసుకురండి (అందుబాటులో: ${product.backroomStockUnits}).`,
        kn: `${product.shelfLocation} ನಲ್ಲಿ ${product.name} ಕಪಾಟನ್ನು ಮರುಪೂರಣ ಮಾಡಿ. ಬ್ಯಾಕ್‌ರೂಮ್‌ನಿಂದ ${unitsToMove} ಯುನಿಟ್‌ಗಳನ್ನು ತರಲು (ಲಭ್ಯವಿದೆ: ${product.backroomStockUnits}).`,
        ml: `${product.shelfLocation}-ൽ ${product.name} ഷെൽഫ് നിറയ്ക്കുക. ബാക്ക്‌റൂമിൽ നിന്ന് ${unitsToMove} എണ്ണം എടുക്കുക (ലഭ്യമാണ്: ${product.backroomStockUnits}).`,
      },
    };
  }

  // CASE 2: Low Visible Shelf + Low Total Inventory + No Backroom Stock -> REORDER
  if (isShelfLow && isInventoryLow && !isBackroomAvailable) {
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      shelfLocation: product.shelfLocation,
      shelfAvailabilityPct: product.visibleAvailabilityPct,
      shelfStatusLabel,
      recordedInventoryUnits: product.recordedInventoryUnits,
      inventoryStatusLabel,
      salesVelocityUnitsPerHour: product.salesVelocityUnitsPerHour,
      salesRateLabel,
      backroomStockUnits: product.backroomStockUnits,
      backroomStatusLabel,
      decisionType: 'REORDER_PRODUCT',
      decisionTitle: `Trigger Purchase Reorder for ${product.name}`,
      whatHappened: `Visible shelf is ${product.visibleAvailabilityPct}%, system inventory is critically low (${product.recordedInventoryUnits} units), and backroom is 0.`,
      whyItHappened: `Sustained demand (${product.salesVelocityUnitsPerHour} units/hr) has fully depleted stock without pending replenishment orders.`,
      whatShouldBeDone: `Trigger automated Supplier EDI PO for 120 units and flag urgent delivery notice.`,
      priority: 'CRITICAL',
      ledState: 'RED',
      confidenceScore: 0.99,
      instructions: {
        en: `CRITICAL STOCK-OUT: Reorder ${product.name} immediately. Total system stock is ${product.recordedInventoryUnits}, backroom is empty.`,
        ta: `முக்கிய எச்சரிக்கை: ${product.name} உடனே மறுஆர்டர் செய்யவும். மொத்த இருப்பு ${product.recordedInventoryUnits}, பின்புற சேமிப்பு காலியாக உள்ளது.`,
        hi: `गंभीर स्टॉक कमी: तुरंत ${product.name} का रीऑर्डर करें। कुल सिस्टम स्टॉक ${product.recordedInventoryUnits} है, बैकरूम खाली है।`,
        te: `తీవ్రమైన కొరత: వెంటనే ${product.name} రీఆర్డర్ చేయండి. మొత్తం సిస్టమ్ స్టాక్ ${product.recordedInventoryUnits}, బ్యాక్‌రూమ్ ఖాళీగా ఉంది.`,
        kn: `ಗಂಭೀರ ಸ್ಟಾಕ್ ಕೊರತೆ: ತಕ್ಷಣವೇ ${product.name} ಅನ್ನು ಮರುಆರ್ಡರ್ ಮಾಡಿ. ಒಟ್ಟು ಸಿಸ್ಟಮ್ ಸ್ಟಾಕ್ ${product.recordedInventoryUnits}, ಬ್ಯಾಕ್‌ರೂಮ್ ಖಾಲಿಯಾಗಿದೆ.`,
        ml: `ഗുരുതരമായ സ്റ്റോക്ക് കുറവ്: ഉടൻ തന്നെ ${product.name} റീഓർഡർ ചെയ്യുക. ആകെ സിസ്റ്റം സ്റ്റോക്ക് ${product.recordedInventoryUnits}, ബാക്ക്‌റൂം ശൂന്യമാണ്.`,
      },
    };
  }

  // CASE 3: Low Visible Shelf + High Inventory + Backroom 0 or Mismatched -> GHOST STOCK / VERIFY
  if (isShelfLow && !isBackroomAvailable && product.recordedInventoryUnits > 20) {
    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      shelfLocation: product.shelfLocation,
      shelfAvailabilityPct: product.visibleAvailabilityPct,
      shelfStatusLabel,
      recordedInventoryUnits: product.recordedInventoryUnits,
      inventoryStatusLabel,
      salesVelocityUnitsPerHour: product.salesVelocityUnitsPerHour,
      salesRateLabel,
      backroomStockUnits: product.backroomStockUnits,
      backroomStatusLabel,
      decisionType: 'VERIFY_INVENTORY',
      decisionTitle: `Audit Discrepancy & Shelf for ${product.name}`,
      whatHappened: `Camera detects empty shelf (${product.visibleAvailabilityPct}% facing), but POS database registers ${product.recordedInventoryUnits} units on hand.`,
      whyItHappened: `Inventory discrepancy (ghost stock) caused by misplacement in other aisles, unrecorded shrinkage, or unscanned checkout items.`,
      whatShouldBeDone: `Staff must perform physical barcode audit on ${product.shelfLocation} and adjacent bays to locate or reconcile ghost stock.`,
      priority: 'HIGH',
      ledState: 'YELLOW',
      confidenceScore: 0.94,
      instructions: {
        en: `Audit shelf discrepancy for ${product.name}. Camera shows empty (${product.visibleAvailabilityPct}%), but inventory records ${product.recordedInventoryUnits} units.`,
        ta: `${product.name} இருப்பு முரண்பாட்டை சரிபார்க்கவும். கேமரா காலி (${product.visibleAvailabilityPct}%) எனக் காட்டுகிறது, ஆனால் சிஸ்டம் ${product.recordedInventoryUnits} பொருட்கள் உள்ளதாகக் கூறுகிறது.`,
        hi: `${product.name} के लिए इन्वेंटरी विसंगति की जांच करें। कैमरा खाली (${product.visibleAvailabilityPct}%) दिखाता है, लेकिन सिस्टम में ${product.recordedInventoryUnits} यूनिट दर्ज हैं।`,
        te: `${product.name} కొరకు ఇన్వెంటరీ వ్యత్యాసాన్ని ఆడిట్ చేయండి. కెమెరా ఖాళీ (${product.visibleAvailabilityPct}%) అని చూపిస్తుంది, కానీ సిస్టమ్ ${product.recordedInventoryUnits} యూనిట్లు రికార్డ్ చేసింది.`,
        kn: `${product.name} ಗಾಗಿ ಇನ್ವೆಂಟರಿ ವ್ಯತ್ಯಾಸವನ್ನು ಪರಿಶೀಲಿಸಿ. ಕ್ಯಾಮೆರಾ ಖಾಲಿ (${product.visibleAvailabilityPct}%) ತೋರಿಸುತ್ತದೆ, ಆದರೆ ಸಿಸ್ಟಮ್ ${product.recordedInventoryUnits} ಯುನಿಟ್‌ಗಳನ್ನು ತೋರಿಸುತ್ತದೆ.`,
        ml: `${product.name}-ൻ്റെ സ്റ്റോക്ക് വ്യത്യാസം പരിശോധിക്കുക. ക്യാമറ ശൂന്യമാണെന്ന് (${product.visibleAvailabilityPct}%) കാണിക്കുന്നു, പക്ഷേ സിസ്റ്റത്തിൽ ${product.recordedInventoryUnits} രേഖപ്പെടുത്തിയിട്ടുണ്ട്.`,
      },
    };
  }

  // DEFAULT / OPTIMAL
  return {
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    category: product.category,
    shelfLocation: product.shelfLocation,
    shelfAvailabilityPct: product.visibleAvailabilityPct,
    shelfStatusLabel,
    recordedInventoryUnits: product.recordedInventoryUnits,
    inventoryStatusLabel,
    salesVelocityUnitsPerHour: product.salesVelocityUnitsPerHour,
    salesRateLabel,
    backroomStockUnits: product.backroomStockUnits,
    backroomStatusLabel,
    decisionType: 'OPTIMAL',
    decisionTitle: `${product.name} Shelf Healthy`,
    whatHappened: `Visible shelf facing is optimal (${product.visibleAvailabilityPct}%) and aligns with demand rate.`,
    whyItHappened: `Balanced sales velocity (${product.salesVelocityUnitsPerHour} units/hr) with sufficient front-facing presentation.`,
    whatShouldBeDone: `No intervention required. Regular monitoring active.`,
    priority: 'LOW',
    ledState: 'GREEN',
    confidenceScore: 0.99,
    instructions: {
      en: `${product.name} is in optimal condition (${product.visibleAvailabilityPct}% facing). No action needed.`,
      ta: `${product.name} நல்ல நிலையில் உள்ளது (${product.visibleAvailabilityPct}%). எந்த நடவடிக்கையும் தேவையில்லை.`,
      hi: `${product.name} इष्टतम स्थिति में है (${product.visibleAvailabilityPct}%)। किसी कार्रवाई की आवश्यकता नहीं है।`,
      te: `${product.name} సరైన స్థితిలో ఉంది (${product.visibleAvailabilityPct}%)। ఎలాంటి చర్య అవసరం లేదు.`,
      kn: `${product.name} ಸೂಕ್ತ ಸ್ಥಿತಿಯಲ್ಲಿದೆ (${product.visibleAvailabilityPct}%). ಯಾವುದೇ ಕ್ರಮ ಅಗತ್ಯವಿಲ್ಲ.`,
      ml: `${product.name} മികച്ച നിലയിലാണ് (${product.visibleAvailabilityPct}%). നടപടിയൊന്നും ആവശ്യമില്ല.`,
    },
  };
}

export function generateActionsFromReconciliation(products: ProductItem[]): OperationalAction[] {
  const actions: OperationalAction[] = [];

  products.forEach((product) => {
    const result = evaluateProductReconciliation(product);
    if (result.decisionType !== 'OPTIMAL') {
      actions.push({
        id: `act-${product.id}-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: result.decisionType as any,
        title: result.decisionTitle,
        targetItemOrZone: `${product.name} (${product.shelfLocation})`,
        whatHappened: result.whatHappened,
        whyItHappened: result.whyItHappened,
        whatShouldBeDone: result.whatShouldBeDone,
        priority: result.priority,
        ledState: result.ledState,
        status: 'PENDING',
        translations: result.instructions,
        preInterventionMetric: {
          label: 'Visible Shelf Availability',
          value: product.visibleAvailabilityPct,
          unit: '%',
        },
      });
    }
  });

  return actions;
}
