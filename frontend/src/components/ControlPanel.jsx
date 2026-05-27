import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Trash2, Sliders, Volume2, Globe } from 'lucide-react';

export default function ControlPanel({ 
  inputValue, 
  setInputValue, 
  onSendMessage, 
  isTyping,
  isRecording,
  onStartRecording,
  onStopRecording,
  interimTranscript,
  speechRate,
  setSpeechRate,
  speechAccent,
  setSpeechAccent,
  onClearHistory,
  micSupported
}) {
  const [showSettings, setShowSettings] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isTyping) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <div className="space-y-3">
      {/* Recording Transcript Overlay (only visible when recording) */}
      {isRecording && (
        <div className="glass-panel border-rose-200 dark:border-rose-950/50 bg-rose-50/30 dark:bg-rose-950/10 p-3 rounded-xl flex items-center justify-between text-xs animate-pulse">
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5 items-end h-4 pr-1">
              <span className="soundwave-bar"></span>
              <span className="soundwave-bar"></span>
              <span className="soundwave-bar"></span>
              <span className="soundwave-bar"></span>
              <span className="soundwave-bar"></span>
            </div>
            <div className="space-y-0.5">
              <span className="font-bold text-rose-600 dark:text-rose-400 block">Gravando áudio...</span>
              <p className="text-slate-600 dark:text-slate-300 italic">
                {interimTranscript || 'Fale em inglês, transcrevendo em tempo real...'}
              </p>
            </div>
          </div>
          <button
            onClick={onStopRecording}
            className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg font-bold transition-colors"
          >
            Concluir
          </button>
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        {/* Settings Toggle */}
        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={`p-3 rounded-xl border transition-all duration-200 focus:outline-none 
            ${showSettings 
              ? 'bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border-violet-300 dark:border-violet-800' 
              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          title="Configurações de Voz"
        >
          <Sliders className="w-5 h-5" />
        </button>

        {/* Input field */}
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isRecording || isTyping}
            placeholder={isRecording ? "Transcrevendo voz..." : "Escreva em inglês... (ex: I want to learn English)"}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50 transition-all text-slate-800 dark:text-slate-100"
          />
          {inputValue && (
            <button
              type="submit"
              disabled={isTyping}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white rounded-lg transition-colors focus:outline-none"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Microphone / Record Button */}
        {micSupported ? (
          <button
            type="button"
            onClick={isRecording ? onStopRecording : onStartRecording}
            disabled={isTyping}
            className={`p-3 rounded-xl border focus:outline-none transition-all duration-300 flex-shrink-0
              ${isRecording 
                ? 'bg-rose-500 border-rose-500 text-white animate-pulse-record' 
                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-rose-500 dark:hover:text-rose-400'
              }`}
            title={isRecording ? "Parar Gravação" : "Falar por Microfone"}
          >
            <Mic className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="p-3 rounded-xl border bg-slate-100 dark:bg-slate-900/50 text-slate-300 dark:text-slate-700 border-slate-200 dark:border-slate-800 flex-shrink-0 cursor-not-allowed"
            title="Microfone não suportado no navegador"
          >
            <MicOff className="w-5 h-5" />
          </button>
        )}

        {/* Trash / Reset Button */}
        <button
          type="button"
          onClick={onClearHistory}
          className="p-3 bg-white dark:bg-slate-900 text-slate-500 border border-slate-200 dark:border-slate-800 hover:border-red-300 hover:text-red-500 dark:hover:border-red-950 dark:hover:text-red-400 rounded-xl transition-all duration-200 focus:outline-none flex-shrink-0"
          title="Limpar Conversa"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </form>

      {/* Voice & Speed Settings Box */}
      {showSettings && (
        <div className="glass-panel p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 shadow-sm animate-fadeIn space-y-3">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5" />
            Configurações de Áudio (Professor)
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Accent Select */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-400" />
                Sotaque / Accent
              </label>
              <select
                value={speechAccent}
                onChange={(e) => setSpeechAccent(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 text-slate-700 dark:text-slate-300"
              >
                <option value="US">American English (en-US)</option>
                <option value="UK">British English (en-GB)</option>
              </select>
            </div>

            {/* Playback Rate Slider */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Velocidade / Speech Speed
                </label>
                <span className="text-[10px] bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold px-1.5 rounded">
                  {speechRate}x {speechRate < 1.0 ? '(Lento)' : speechRate > 1.0 ? '(Rápido)' : '(Normal)'}
                </span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-violet-600 focus:outline-none py-1.5"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
