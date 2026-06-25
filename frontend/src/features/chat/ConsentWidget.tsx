import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

const TRANSLATIONS = {
  English: "I acknowledge the high risks associated with this action and assume full financial liability.",
  Hindi: "मुझे पता है कि इसमें बहुत ज़्यादा रिस्क है, और अगर मेरा कोई भी नुकसान होता है तो उसकी पूरी ज़िम्मेदारी मेरी होगी।",
  Bengali: "আমি এই পদক্ষেপের সাথে যুক্ত উচ্চ ঝুঁকিগুলি স্বীকার করছি এবং সম্পূর্ণ আর্থিক দায়বদ্ধতা গ্রহণ করছি।",
  Marathi: "मी या कृतीशी संबंधित उच्च धोके मान्य करतो आणि संपूर्ण आर्थिक जबाबदारी घेतो.",
  Telugu: "నేను ఈ చర్యతో ముడిపడి ఉన్న అధిక నష్టాలను అంగీకరిస్తున్నాను మరియు పూర్తి ఆర్థిక బాధ్యతను తీసుకుంటాను.",
  Tamil: "இந்தச் செயலால் ஏற்படும் அதிக அபாயங்களை நான் ஏற்றுக்கொள்கிறேன் மற்றும் முழு நிதிப் பொறுப்பையும் நான் ஏற்றுக்கொள்கிறேன்."
};

type Language = keyof typeof TRANSLATIONS;

interface ConsentWidgetProps {
  onAccept: (intentPayload: string) => void;
  disabled?: boolean;
}

export function ConsentWidget({ onAccept, disabled = false }: ConsentWidgetProps) {
  const [language, setLanguage] = useState<Language>('English');
  const [isChecked, setIsChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleAccept = () => {
    if (!isChecked) return;
    setSubmitted(true);
    // Submit the strict system payload that bypasses NLP
    onAccept('[SYSTEM_INTENT: OVERRIDE_CONSENT_GRANTED]');
  };

  if (submitted || disabled) {
    return (
      <div className="mt-4 p-4 rounded-xl border border-green-200 bg-green-50 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-green-900">Acknowledgement Received</p>
          <p className="text-xs text-green-700 mt-1">We have noted your confirmation to proceed with this action.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 rounded-xl border border-red-200 bg-red-50 flex flex-col gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
          <AlertTriangle className="w-5 h-5" />
          <span>SEBI Risk Acknowledgment</span>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="text-xs border border-red-200 bg-white text-red-900 rounded px-2 py-1 outline-none focus:border-red-400"
        >
          {Object.keys(TRANSLATIONS).map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>

      <div className="bg-white p-3 rounded border border-red-100 text-sm text-slate-800">
        {TRANSLATIONS[language]}
      </div>

      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-start mt-0.5">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="peer appearance-none w-4 h-4 border border-slate-300 rounded bg-white checked:bg-brand-navy checked:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
          />
          <svg
            className="absolute w-4 h-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span className="text-xs text-slate-600 leading-tight select-none">
          By checking this box, I confirm that I have read the warning and understand the risks. I agree that the bank is not liable for any losses incurred.
        </span>
      </label>

      <button
        onClick={handleAccept}
        disabled={!isChecked}
        className="w-full py-2 bg-brand-navy text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-navy/90 transition-colors"
      >
        I Accept Liability & Proceed
      </button>
    </div>
  );
}
