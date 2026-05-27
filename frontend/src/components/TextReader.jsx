import React, { useState, useRef } from 'react';
import { FileText, Upload, Play, Square, Pause } from 'lucide-react';

export default function TextReader() {
  const [text, setText] = useState('');
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target.result);
    reader.readAsText(file);
  };

  const handlePlay = () => {
    if (paused) {
      speechSynthesis.resume();
      setPaused(false);
      return;
    }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => { setPlaying(false); setPaused(false); };
    speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  const handlePause = () => {
    speechSynthesis.pause();
    setPaused(true);
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setPlaying(false);
    setPaused(false);
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 p-4 shadow-sm">
      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
        <FileText className="w-4 h-4 text-violet-500" />
        Leitor de Texto
      </h3>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Cole aqui um texto, letra de música, artigo em inglês..."
        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400"
        rows={5}
      />

      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Importar arquivo
        </button>
        <input ref={fileRef} type="file" accept=".txt,.srt,.lrc,.md" onChange={handleFile} className="hidden" />

        <div className="flex-1" />

        {!playing ? (
          <button
            onClick={handlePlay}
            disabled={!text.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
            Ler em voz alta
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={paused ? handlePlay : handlePause}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors"
            >
              <Pause className="w-3.5 h-3.5" />
              {paused ? 'Continuar' : 'Pausar'}
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold transition-colors"
            >
              <Square className="w-3.5 h-3.5" />
              Parar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
