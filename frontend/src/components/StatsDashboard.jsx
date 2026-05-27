import React, { useState } from 'react';
import { Award, CheckCircle2, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

export default function StatsDashboard({ stats, onRetrySentence, isLoadingStats, onRefresh }) {
  const [expandedErrorIdx, setExpandedErrorIdx] = useState(null);

  if (isLoadingStats) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 dark:text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mb-2" />
        <p>Carregando estatísticas...</p>
      </div>
    );
  }

  const {
    total_sentences = 0,
    correct_sentences = 0,
    incorrect_sentences = 0,
    accuracy_rate = 100,
    revision_list = []
  } = stats || {};

  const toggleExpand = (idx) => {
    setExpandedErrorIdx(expandedErrorIdx === idx ? null : idx);
  };

  // Determine color based on accuracy rate
  const getProgressColor = (rate) => {
    if (rate >= 80) return 'stroke-emerald-500 text-emerald-500';
    if (rate >= 50) return 'stroke-amber-500 text-amber-500';
    return 'stroke-rose-500 text-rose-500';
  };

  const ringColorClass = getProgressColor(accuracy_rate);

  // Math for circle path
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy_rate / 100) * circumference;

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Award className="text-violet-500 w-6 h-6" />
            Progresso de Aprendizado
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Dados baseados no seu histórico de conversas.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="p-2 text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
          title="Atualizar Estatísticas"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {total_sentences === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">Nenhum dado registrado</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px]">
            Comece a conversar em inglês com o professor para visualizar suas estatísticas aqui!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Chart Card */}
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-around shadow-sm transition-all duration-300 hover:shadow-md">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-slate-200 dark:stroke-slate-800 fill-none"
                  strokeWidth="8"
                />
                {/* Active Ring */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className={`fill-none transition-all duration-500 ${ringColorClass}`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {accuracy_rate}%
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Precisão</span>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">Desempenho</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-[160px]">
                {accuracy_rate >= 80 
                  ? "Excelente! Suas estruturas gramaticais estão muito sólidas."
                  : accuracy_rate >= 50
                  ? "Bom trabalho! Continue praticando para polir os pequenos erros."
                  : "Não desanime! Focar na correção dos erros vai te ajudar a evoluir."}
              </p>
            </div>
          </div>

          {/* Counts Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800/50 p-3 rounded-xl text-center">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Total</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{total_sentences}</span>
            </div>
            
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-950/50 p-3 rounded-xl text-center">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Corretas
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{correct_sentences}</span>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-950/50 p-3 rounded-xl text-center">
              <span className="text-xs text-rose-600 dark:text-rose-400 block font-medium flex items-center justify-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Erros
              </span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{incorrect_sentences}</span>
            </div>
          </div>

          {/* Revision Section */}
          {revision_list.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                Revisão de Erros ({revision_list.length})
              </h3>
              
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {revision_list.map((item, idx) => {
                  const isExpanded = expandedErrorIdx === idx;
                  return (
                    <div 
                      key={idx} 
                      className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden text-sm bg-white dark:bg-slate-900/40"
                    >
                      {/* Summary Row */}
                      <div 
                        onClick={() => toggleExpand(idx)}
                        className="p-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <span className="font-medium text-rose-600 dark:text-rose-400 line-clamp-1 pr-2">
                          "{item.text}"
                        </span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRetrySentence(item.text);
                            }}
                            className="p-1.5 text-slate-500 hover:text-violet-500 dark:text-slate-400 dark:hover:text-violet-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Praticar esta frase novamente"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>

                      {/* Expandable Correction Details */}
                      {isExpanded && (
                        <div className="p-3 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
                          {/* Corrections list */}
                          {item.corrections && item.corrections.length > 0 && (
                            <div>
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">Correções recomendadas:</span>
                              <div className="flex flex-wrap gap-1">
                                {item.corrections.map((corr, cIdx) => (
                                  <span 
                                    key={cIdx} 
                                    className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono"
                                  >
                                    {corr}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Explanation */}
                          {item.explanation && (
                            <div>
                              <span className="font-semibold text-slate-500 dark:text-slate-400 block mb-1">Explicação:</span>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {item.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
