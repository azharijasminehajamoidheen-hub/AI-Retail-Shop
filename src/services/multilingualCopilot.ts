import { LanguageCode } from '../types';

export interface CopilotMessage {
  id: string;
  sender: 'SYSTEM' | 'STAFF' | 'COPILOT';
  text: string;
  language: LanguageCode;
  timestamp: string;
  actionRefId?: string;
  audioAvailable?: boolean;
}

export const COPILOT_SAMPLE_QUERIES: Record<LanguageCode, string[]> = {
  en: [
    'Where should I restock first?',
    'Why is Counter 2 being opened?',
    'Explain the inventory mismatch for whole wheat bread.',
    'What are my top priority tasks right now?',
  ],
  ta: [
    'நான் முதலில் எங்கு பொருட்களை நிரப்ப வேண்டும்?',
    'கவுண்டர் 2 ஏன் திறக்கப்படுகிறது?',
    'கோதுமை ரொட்டி இருப்பு முரண்பாட்டை விளக்குங்கள்.',
    'இப்போது செய்ய வேண்டிய முக்கிய வேலைகள் என்ன?',
  ],
  hi: [
    'मुझे सबसे पहले कहां स्टॉक भरना चाहिए?',
    'काउंटर 2 क्यों खोला जा रहा है?',
    'होल व्हीट ब्रेड के इन्वेंटरी बेमेल को समझाइए।',
    'अभी मेरे सबसे जरूरी काम कौन से हैं?',
  ],
  te: [
    'నేను మొదట ఎక్కడ సరుకు నింపాలి?',
    'కౌంటర్ 2 ఎందుకు తెరవబడుతోంది?',
    'హోల్ వీట్ బ్రెడ్ ఇన్వెంటరీ వ్యత్యాసాన్ని వివరించండి.',
    'ప్రస్తుతం నా ముఖ్యమైన పనులు ఏమిటి?',
  ],
  kn: [
    'ನಾನು ಮೊದಲು ಎಲ್ಲಿ ಸ್ಟಾಕ್ ತುಂಬಬೇಕು?',
    'ಕೌಂಟರ್ 2 ಅನ್ನು ಏಕೆ ತೆರೆಯಲಾಗುತ್ತಿದೆ?',
    'ಗೋಧಿ ಬ್ರೆಡ್ ದಾಸ್ತಾನು ವ್ಯತ್ಯಾಸವನ್ನು ವಿವರಿಸಿ.',
    'ಈಗ ನನ್ನ ಪ್ರಮುಖ ಕೆಲಸಗಳು ಯಾವುವು?',
  ],
  ml: [
    'ഞാൻ ആദ്യം എവിടെ സാധനങ്ങൾ നിറയ്ക്കണം?',
    'കൗണ്ടർ 2 എന്തിനാണ് തുറക്കുന്നത്?',
    'ഹോൾ വീറ്റ് ബ്രെഡ് സ്റ്റോക്ക് വ്യത്യാസം വിശദീകരിക്കുക.',
    'ഇപ്പോൾ ചെയ്യേണ്ട പ്രധാന ജോലികൾ എന്തൊക്കെയാണ്?',
  ],
};

// Offline local deterministic dictionary answers
export const OFFLINE_COPILOT_KNOWLEDGE_BASE: Record<LanguageCode, Record<string, string>> = {
  en: {
    restock: 'Priority 1: Aisle 1 Coca-Cola Zero (20% shelf, 34 units in backroom). Priority 2: Aisle 1 Dairy Milk (15% shelf, 0 in backroom - needs reorder).',
    counter2: 'Counter 1 has 7 customers and arrival rate is 5.2 cust/min. Predicted queue is 10 people in 10 mins. Opening Counter 2 prevents bottle-necking.',
    discrepancy: 'Camera detects only 18% facing for Artisan Sourdough on Aisle 3, but inventory shows 65 units. Physical audit needed to verify ghost stock.',
    general: 'RetailPulse Edge is monitoring 5 shelf zones and 3 checkout counters. 3 operational actions are pending your review.',
  },
  ta: {
    restock: 'முதன்மை 1: அலமாரி 1 கோக் ஜீரோ (20% இருப்பு, பின்புற சேமிப்பில் 34 உள்ளது). முதன்மை 2: அலமாரி 1 பால் (15% இருப்பு, மறுஆர்டர் தேவை).',
    counter2: 'கவுண்டர் 1-ல் 7 பேர் காத்திருக்கிறார்கள். வருகை வேகம் அதிகம். 10 நிமிடங்களில் 10 பேராக கூடும் என்பதால் கவுண்டர் 2 திறக்கப்படுகிறது.',
    discrepancy: 'அலமாரி 3-ல் ரொட்டி 18% மட்டுமே உள்ளது, ஆனால் கணினியில் 65 பொருட்கள் உள்ளன. தவறான இடத்திலுள்ளதா என அலமாரியை சரிபார்க்கவும்.',
    general: 'ரீடெய்ல் பல்ஸ் எட்ஜ் 5 அலமாரி பகுதிகள் மற்றும் 3 கவுண்டர்களைக் கண்காணிக்கிறது. 3 உடனடி பணிகள் நிலுவையில் உள்ளன.',
  },
  hi: {
    restock: 'प्राथमिकता 1: आइल 1 कोका-कोला (20% शेल्फ, बैकरूम में 34 यूनिट)। प्राथमिकता 2: आइल 1 दूध (15% शेल्फ, रीऑर्डर की आवश्यकता)।',
    counter2: 'काउंटर 1 पर 7 ग्राहक हैं। 10 मिनट में कतार 10 ग्राहकों तक पहुंचने का अनुमान है, इसलिए काउंटर 2 खोला जा रहा है।',
    discrepancy: 'आइल 3 पर ब्रेड केवल 18% दिखाई दे रही है, जबकि सिस्टम में 65 यूनिट दर्ज हैं। कृपया भौतिक जांच करें।',
    general: 'रिटेलपल्स एज 5 शेल्फ जोन और 3 चेकआउट काउंटरों की निगरानी कर रहा है। 3 कार्य लंबित हैं।',
  },
  te: {
    restock: 'ప్రాధాన్యత 1: ఐల్ 1 కోకా-కోలా (20% షెల్ఫ్, బ్యాక్‌రూమ్‌లో 34 యూనిట్లు). ప్రాధాన్యత 2: ఐల్ 1 పాలు (రీఆర్డర్ అవసరం).',
    counter2: 'కౌంటర్ 1 వద్ద 7 మంది ఉన్నారు. 10 నిమిషాల్లో క్యూ 10 మందికి పెరగవచ్చని మోడల్ అంచనా వేసింది, అందుకే కౌంటర్ 2 తెరుస్తున్నాము.',
    discrepancy: 'ఐల్ 3 వద్ద బ్రెడ్ 18% మాత్రమే ఉంది, కానీ సిస్టమ్‌లో 65 యూనిట్లు ఉన్నాయి. దయచేసి షెల్ఫ్ పరిశీలించండి.',
    general: 'రిటైల్‌పల్స్ ఎడ్జ్ స్టోర్‌ను నిరంతరం పర్యవేక్షిస్తోంది. 3 చర్యలు పెండింగ్‌లో ఉన్నాయి.',
  },
  kn: {
    restock: 'ಆದ್ಯತೆ 1: ಐಲ್ 1 ಕೋಕಾ-ಕೋಲಾ (20% ಶೆಲ್ಫ್, ಬ್ಯಾಕ್‌ರೂಮ್‌ನಲ್ಲಿ 34 ಯೂನಿಟ್‌ಗಳು). ಆದ್ಯತೆ 2: ಐಲ್ 1 ಹಾಲು (ಮರುಆರ್ಡರ್ ಅಗತ್ಯವಿದೆ).',
    counter2: 'ಕೌಂಟರ್ 1 ರಲ್ಲಿ 7 ಗ್ರಾಹಕರಿದ್ದಾರೆ. ಮುಂದಿನ 10 ನಿಮಿಷಗಳಲ್ಲಿ 10 ಕ್ಕೆ ತಲುಪುವ ಸಾಧ್ಯತೆಯಿರುವುದರಿಂದ ಕೌಂಟರ್ 2 ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
    discrepancy: 'ಐಲ್ 3 ರಲ್ಲಿ ಬ್ರೆಡ್ 18% ಮಾತ್ರ ಕಾಣಿಸುತ್ತಿದೆ, ಆದರೆ ಸಿಸ್ಟಮ್ 65 ಯುನಿಟ್ ತೋರಿಸುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ.',
    general: 'ರೀಟೇಲ್‌ಪಲ್ಸ್ ಎಡ್ಜ್ 5 ಶೆಲ್ಫ್ ವಲಯಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡುತ್ತಿದೆ. 3 ಕಾರ್ಯಗಳು ಬಾಕಿ ಇವೆ.',
  },
  ml: {
    restock: 'മുൻഗണന 1: ഐൽ 1 കൊക്കകോള (20% ഷെൽഫ്, ബാക്ക്‌റൂമിൽ 34 എണ്ണം). മുൻഗണന 2: ഐൽ 1 പാൽ (റീഓർഡർ വേണം).',
    counter2: 'കൗണ്ടർ 1-ൽ 7 പേരുണ്ട്. 10 മിനിറ്റിനുള്ളിൽ തിരക്ക് 10 ആകാൻ സാധ്യതയുള്ളതിനാലാണ് കൗണ്ടർ 2 തുറക്കുന്നത്.',
    discrepancy: 'ഐൽ 3-ൽ ബ്രെഡ് 18% മാത്രമേയുള്ളൂ, എന്നാൽ സിസ്റ്റത്തിൽ 65 എണ്ണം കാണിക്കുന്നു. നേരിട്ട് പരിശോധിക്കുക.',
    general: 'റീട്ടെയിൽപൾസ് എഡ്ജ് 5 ഷെൽഫുകളും 3 കൗണ്ടറുകളും നിരീക്ഷിക്കുന്നു. 3 ജോലികൾ ബാക്കിയുണ്ട്.',
  },
};

export async function askStaffCopilot(query: string, language: LanguageCode, isOfflineMode: boolean = false): Promise<string> {
  const lower = query.toLowerCase();

  // If offline or offline mode requested, use deterministic rule matcher
  if (isOfflineMode) {
    const langDict = OFFLINE_COPILOT_KNOWLEDGE_BASE[language] || OFFLINE_COPILOT_KNOWLEDGE_BASE.en;
    if (lower.includes('restock') || lower.includes('நிரப்ப') || lower.includes('भरें') || lower.includes('నింపాలి') || lower.includes('ತುಂಬಬೇಕು') || lower.includes('നിറയ്ക്കണം')) {
      return langDict.restock;
    }
    if (lower.includes('counter') || lower.includes('queue') || lower.includes('கவுண்டர்') || lower.includes('வரிசை') || lower.includes('कतार') || lower.includes('కౌంటర్') || lower.includes('ಕೌಂಟರ್') || lower.includes('കൗണ്ടർ')) {
      return langDict.counter2;
    }
    if (lower.includes('bread') || lower.includes('discrepancy') || lower.includes('mismatch') || lower.includes('ரொட்டி') || lower.includes('ब्रेड') || lower.includes('బ్రెడ్') || lower.includes('ಬ್ರೆಡ್') || lower.includes('ബ്രെഡ്')) {
      return langDict.discrepancy;
    }
    return langDict.general;
  }

  // Attempt server API with Gemini 3.7 Flash fallback
  try {
    const res = await fetch('/api/copilot/explain', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, language }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.explanation) {
        return data.explanation;
      }
    }
  } catch (err) {
    console.warn('Online copilot fallback to local offline knowledge base', err);
  }

  // Local fallback
  const langDict = OFFLINE_COPILOT_KNOWLEDGE_BASE[language] || OFFLINE_COPILOT_KNOWLEDGE_BASE.en;
  return langDict.general;
}

export function speakVernacularText(text: string, language: LanguageCode) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  const langMap: Record<LanguageCode, string> = {
    en: 'en-US',
    ta: 'ta-IN',
    hi: 'hi-IN',
    te: 'te-IN',
    kn: 'kn-IN',
    ml: 'ml-IN',
  };
  utterance.lang = langMap[language] || 'en-US';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
