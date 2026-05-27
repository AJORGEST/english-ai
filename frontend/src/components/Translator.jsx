import React, { useState } from 'react';
import { ArrowRightLeft, Loader2, Volume2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function Translator() {
  const [text, setText] = useState('');
  const [direction, setDirection] = useState('pt-en'); // "pt-en" ou "en-pt"
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const fromLang = direction === 'pt-en' ? 'Português' : 'English';
  const toLang = direction === 'pt-en' ? 'English' : 'Português';

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), direction })
      });
      if (res.ok) {
        setResult(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setDirection(d => d === 'pt-en' ? 'en-pt' : 'pt-en');
    if (result?.translation) {
      setText(result.translation);
      setResult(null);
    }
  };

  const speak = (textToSpeak) => {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = direction === 'pt-en' ? 'en-US' : 'pt-BR';
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
        <ArrowRightLeft className="w-4 h-4 text-violet-500" />
        Tradutor
      </h3>

      {/* Direction selector */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{fromLang}</span>
        <button
          onClick={handleSwap}
          className="p-1.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
          title="Inverter direção"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">{toLang}</span>
      </div>

      {/* Input */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`Digite em ${fromLang}...`}
        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
        rows={3}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTranslate(); } }}
      />

      <button
        onClick={handleTranslate}
        disabled={loading || !text.trim()}
        className="mt-2 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Traduzir'}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">{result.translation}</p>
            <button onClick={() => speak(result.translation)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 shrink-0" title="Ouvir">
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
          {result.pronunciation && (
            <p className="mt-1.5 text-xs font-mono text-violet-600 dark:text-violet-400">{result.pronunciation}</p>
          )}
        </div>
      )}
    </div>
  );
}
