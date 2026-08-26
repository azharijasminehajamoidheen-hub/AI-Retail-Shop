import React, { useState } from 'react';
import { LanguageCode, OperationalAction } from '../types';
import { SUPPORTED_LANGUAGES } from '../data/mockStoreData';
import { 
  Languages, 
  Volume2, 
  Send, 
  Sparkles, 
  MessageSquare, 
  Bot, 
  User, 
  ShieldCheck,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { 
  askStaffCopilot, 
  speakVernacularText, 
  COPILOT_SAMPLE_QUERIES 
} from '../services/multilingualCopilot';

interface MultilingualCopilotViewProps {
  selectedLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  actions: OperationalAction[];
  isOfflineMode: boolean;
}

export const MultilingualCopilotView: React.FC<MultilingualCopilotViewProps> = ({
  selectedLanguage,
  onLanguageChange,
  actions,
  isOfflineMode,
}) => {
  const [messages, setMessages] = useState<
    { id: string; sender: 'COPILOT' | 'STAFF'; text: string; timestamp: string }[]
  >([
    {
      id: 'msg-1',
      sender: 'COPILOT',
      text:
        selectedLanguage === 'ta'
          ? 'வணக்கம்! நான் உங்கள் ரீடெய்ல் பல்ஸ் பணியாளர் உதவியாளர். அலமாரிகளை நிரப்புதல் அல்லது கவுண்டர் திறப்பது பற்றி ஏதேனும் கேட்கலாம்.'
          : selectedLanguage === 'hi'
          ? 'नमस्ते! मैं आपका रिटेलपल्स स्टाफ सहायक हूं। आप अलमारियों को फिर से भरने या काउंटर खोलने के बारे में पूछ सकते हैं।'
          : selectedLanguage === 'te'
          ? 'నమస్కారం! నేను మీ రిటైల్‌పల్స్ సిబ్బంది సహాయకుడిని. షెల్ఫ్‌లను నింపడం లేదా కౌంటర్ తెరవడం గురించి నన్ను అడగవచ్చు.'
          : selectedLanguage === 'kn'
          ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸಿಬ್ಬಂದಿ ಸಹಾಯಕ. ಕಪಾಟುಗಳನ್ನು ಮರುಪೂರಣ ಮಾಡುವ ಬಗ್ಗೆ ನೀವು ಕೇಳಬಹುದು.'
          : selectedLanguage === 'ml'
          ? 'നമസ്കാരം! ഞാൻ നിങ്ങളുടെ സ്റ്റാഫ് അസിസ്റ്റന്റാണ്. സാധനങ്ങൾ നിറയ്ക്കുന്നതിനെക്കുറിച്ചോ കൗണ്ടർ തുറക്കുന്നതിനെക്കുറിച്ചോ ചോദിക്കാം.'
          : 'Hello! I am your RetailPulse Staff Copilot. I translate edge operational decisions into clear tasks in your chosen language.',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sampleQueries = COPILOT_SAMPLE_QUERIES[selectedLanguage] || COPILOT_SAMPLE_QUERIES.en;

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'STAFF' as const,
      text: textToSend,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    const reply = await askStaffCopilot(textToSend, selectedLanguage, isOfflineMode);

    const botMsg = {
      id: `bot-${Date.now()}`,
      sender: 'COPILOT' as const,
      text: reply,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="space-y-5">
      {/* Header & Language Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-widest">
              Multilingual Staff Copilot
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Natural language instruction delivery for supermarket floor staff &amp; cashiers
          </p>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1 rounded-md border border-slate-200">
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                selectedLanguage === lang.code
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {lang.nativeLabel} ({lang.label})
            </button>
          ))}
        </div>
      </div>

      {/* Distinction & Role Note */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-blue-600 text-xs">
        <div className="flex items-center space-x-2 text-slate-900 font-bold uppercase tracking-wider text-[11px] mb-0.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Architectural Integrity Rule</span>
        </div>
        <p className="text-slate-500 leading-relaxed text-xs">
          The Multilingual Copilot is <strong>not</strong> the decision maker. The deterministic Edge Engine calculates directives first; the copilot only communicates tasks clearly in local vernacular languages.
        </p>
      </div>

      {/* Main Copilot Chat & Live Broadcast Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Live Translated Operational Directives (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Translated Directives ({selectedLanguage.toUpperCase()})
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                {actions.filter((a) => a.status === 'PENDING').length} Pending
              </span>
            </div>

            {actions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No active directives.</p>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {actions.map((act) => {
                  const translatedText = act.translations[selectedLanguage] || act.translations.en;
                  return (
                    <div
                      key={act.id}
                      className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 border-l-4 border-l-orange-500"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900 uppercase tracking-tight">{act.title}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-800 uppercase tracking-wider">
                          {act.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{translatedText}</p>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => speakVernacularText(translatedText, selectedLanguage)}
                          className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-bold uppercase tracking-wider text-blue-600 cursor-pointer shadow-xs"
                        >
                          <Volume2 className="w-3 h-3 text-blue-600" />
                          <span>Voice Output</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Interactive Assistant Chat (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Floor Assistant Copilot</span>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                  {isOfflineMode ? '● Local Edge Dictionary (Offline)' : '● Gemini 3.7 Flash + Local Cache'}
                </span>
              </div>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex space-x-2 ${m.sender === 'STAFF' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'COPILOT' && (
                  <div className="w-6 h-6 rounded bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 mt-0.5 border border-blue-200">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-lg max-w-[80%] text-xs space-y-1.5 ${
                    m.sender === 'STAFF'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-50 text-slate-800 border border-slate-200'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>
                  <div className="flex items-center justify-between text-[10px] opacity-70 font-mono">
                    <span>{m.timestamp}</span>
                    {m.sender === 'COPILOT' && (
                      <button
                        onClick={() => speakVernacularText(m.text, selectedLanguage)}
                        className="hover:underline flex items-center space-x-0.5 ml-2 cursor-pointer font-sans"
                      >
                        <Volume2 className="w-2.5 h-2.5" />
                        <span>Speak</span>
                      </button>
                    )}
                  </div>
                </div>
                {m.sender === 'STAFF' && (
                  <div className="w-6 h-6 rounded bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="text-xs text-slate-400 italic flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                <span>Translating and analyzing store context...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-1.5">
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(sq)}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium cursor-pointer transition-all truncate max-w-[320px]"
              >
                {sq}
              </button>
            ))}
          </div>

          {/* Message Input Box */}
          <div className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
            <input
              type="text"
              placeholder={`Ask floor copilot in ${selectedLanguage.toUpperCase()}...`}
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-xs focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputQuery.trim()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
