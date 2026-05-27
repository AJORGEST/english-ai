import React, { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX, CheckCircle, AlertTriangle, Sparkles, MessageCircle } from 'lucide-react';

export default function ChatWindow({ 
  messages, 
  isTyping, 
  onSuggestedReplyClick, 
  onSpeakMessage, 
  currentlySpeakingId,
  onStopSpeaking,
  quizScore,
  onQuizAnswer
}) {
  const chatEndRef = useRef(null);
  const [expandedMessageId, setExpandedMessageId] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null); // {idx, is_correct}

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Reset quiz answer when new messages arrive
  useEffect(() => {
    setSelectedAnswer(null);
  }, [messages.length]);

  const toggleExpand = (id) => {
    setExpandedMessageId(expandedMessageId === id ? null : id);
  };

  // Find the last teacher message to extract suggestions
  const lastTeacherMessageIndex = [...messages].reverse().findIndex(m => m.sender === 'teacher');
  const lastTeacherMessage = lastTeacherMessageIndex !== -1 ? [...messages].reverse()[lastTeacherMessageIndex] : null;

  return (
    <div className="flex flex-col h-full bg-white/40 dark:bg-slate-900/10 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 overflow-hidden shadow-sm">
      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 bg-violet-100 dark:bg-violet-950/40 rounded-full flex items-center justify-center text-violet-500 mb-4 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Welcome to English AI!</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[280px]">
              Diga ou digite algo em inglês. Eu vou corrigir seus erros e conversar com você!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isStudent = msg.sender === 'student';
            const isSpeaking = currentlySpeakingId === msg.id;

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
              >
                {/* Bubble Container */}
                <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 transition-all duration-300 relative group
                  ${isStudent 
                    ? msg.is_correct 
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 rounded-tr-none cursor-pointer' 
                      : 'bg-amber-50 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200 border border-amber-300 dark:border-amber-900/50 rounded-tr-none cursor-pointer'
                    : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800/80 rounded-tl-none'
                  }
                  ${!isStudent && isSpeaking ? 'ring-2 ring-violet-500 ring-offset-2 dark:ring-offset-slate-950' : ''}
                `}
                  onClick={() => isStudent && toggleExpand(msg.id)}
                >
                  {/* Status Badges for Student Messages */}
                  {isStudent && (
                    <div className="absolute -top-2.5 -left-2.5 flex items-center justify-center rounded-full bg-white dark:bg-slate-950 shadow-sm border border-slate-100 dark:border-slate-800 p-0.5">
                      {msg.is_correct ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950/50" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500 fill-amber-100 dark:fill-amber-950/50" />
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="text-sm sm:text-base leading-relaxed break-words font-medium">
                    {msg.text}
                  </p>

                  {/* Speak Icon for Teacher Message */}
                  {!isStudent && (
                    <div className="mt-2 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
                        Teacher Reply
                      </span>
                      {isSpeaking ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStopSpeaking();
                          }}
                          className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-semibold focus:outline-none"
                        >
                          <VolumeX className="w-4 h-4 animate-pulse" />
                          <div className="flex gap-0.5 items-end h-3">
                            <span className="soundwave-bar"></span>
                            <span className="soundwave-bar"></span>
                            <span className="soundwave-bar"></span>
                          </div>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSpeakMessage(msg);
                          }}
                          className="text-slate-400 hover:text-violet-500 dark:text-slate-500 dark:hover:text-violet-400 p-1 rounded transition-colors focus:outline-none"
                          title="Ouvir resposta"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Click to expand hint */}
                  {isStudent && !msg.is_correct && (
                    <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                      <span>Clique para ver explicações</span>
                    </div>
                  )}
                  {isStudent && msg.is_correct && msg.pronunciation && (
                    <div className="mt-2 text-[10px] text-emerald-300 dark:text-emerald-600 font-semibold flex items-center gap-1">
                      <span>Clique para ver pronúncia</span>
                    </div>
                  )}
                </div>

                {/* Expanded Correction Drawer for errors */}
                {isStudent && !msg.is_correct && expandedMessageId === msg.id && (
                  <div className="w-[85%] sm:w-[75%] mt-1.5 bg-amber-50/70 dark:bg-amber-950/10 border border-amber-200 dark:border-amber-950 rounded-xl p-3.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm animate-fadeIn">
                    {msg.corrected_text && (
                      <div className="mb-2">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">✅ Frase correta:</span>
                        <p className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-200 px-2.5 py-1.5 rounded font-medium text-sm">
                          {msg.corrected_text}
                        </p>
                      </div>
                    )}
                    {msg.pronunciation && (
                      <div className="mb-2">
                        <span className="font-bold text-violet-700 dark:text-violet-400 block mb-1">🔊 Pronúncia (IPA):</span>
                        <p className="bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-200 px-2.5 py-1.5 rounded font-mono text-sm">
                          {msg.pronunciation}
                        </p>
                      </div>
                    )}
                    {msg.corrections && msg.corrections.length > 0 && (
                      <div className="mb-2">
                        <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">Correções:</span>
                        <div className="flex flex-wrap gap-1">
                          {msg.corrections.map((corr, idx) => (
                            <span key={idx} className="bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded font-mono">
                              {corr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {msg.explanation && (
                      <div>
                        <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">Por que está errado?</span>
                        <p className="leading-relaxed text-slate-600 dark:text-slate-300">{msg.explanation}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded Drawer for correct messages (pronunciation) */}
                {isStudent && msg.is_correct && expandedMessageId === msg.id && (msg.pronunciation || msg.explanation) && (
                  <div className="w-[85%] sm:w-[75%] mt-1.5 bg-emerald-50/70 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-950 rounded-xl p-3.5 text-xs text-slate-700 dark:text-slate-300 shadow-sm animate-fadeIn">
                    {msg.pronunciation && (
                      <div className="mb-2">
                        <span className="font-bold text-violet-700 dark:text-violet-400 block mb-1">🔊 Pronúncia (IPA):</span>
                        <p className="bg-violet-50 dark:bg-violet-950/30 text-violet-800 dark:text-violet-200 px-2.5 py-1.5 rounded font-mono text-sm">
                          {msg.pronunciation}
                        </p>
                      </div>
                    )}
                    {msg.explanation && (
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 block mb-1">💡 Dica:</span>
                        <p className="leading-relaxed text-slate-600 dark:text-slate-300">{msg.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading / Typing indicator */}
        {isTyping && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="max-w-[75%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-violet-400 dark:bg-violet-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-violet-500 dark:bg-violet-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-violet-600 dark:bg-violet-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold mt-2 block">
                Teacher is thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Quiz: Suggested Replies */}
      {messages.length > 0 && !isTyping && lastTeacherMessage && lastTeacherMessage.suggested_replies && lastTeacherMessage.suggested_replies.length > 0 && (
        <div className="p-3 bg-slate-50/50 dark:bg-slate-950/30 border-t border-slate-200/50 dark:border-slate-800/40">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-semibold">
              <MessageCircle className="w-3.5 h-3.5" />
              🎯 Qual é a resposta correta?
            </div>
            {quizScore !== undefined && (
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400">⭐ {quizScore} pts</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {lastTeacherMessage.suggested_replies.map((reply, idx) => {
              const replyText = typeof reply === 'string' ? reply : reply.text;
              const isCorrect = typeof reply === 'string' ? null : reply.is_correct;
              const isSelected = selectedAnswer?.idx === idx;
              const answered = selectedAnswer !== null;

              let btnClass = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-900";
              if (answered) {
                if (isCorrect) {
                  btnClass = "bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-500 text-emerald-800 dark:text-emerald-200";
                } else if (isSelected) {
                  btnClass = "bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-500 text-rose-800 dark:text-rose-200 line-through";
                } else {
                  btnClass = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 opacity-60";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={answered}
                  onClick={() => {
                    setSelectedAnswer({ idx, is_correct: isCorrect });
                    onQuizAnswer(isCorrect, replyText);
                  }}
                  className={`${btnClass} px-3 py-2 rounded-xl text-xs font-medium text-left transition-all duration-200 active:scale-[0.98] shadow-sm flex items-center gap-2`}
                >
                  {answered && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                  {answered && isSelected && !isCorrect && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                  {replyText}
                </button>
              );
            })}
          </div>
          {selectedAnswer && !selectedAnswer.is_correct && (
            <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium px-1">
              ❌ Errou! A resposta correta está destacada em verde.
            </p>
          )}
          {selectedAnswer && selectedAnswer.is_correct && (
            <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium px-1">
              ✅ Correto! +10 pontos!
            </p>
          )}
        </div>
      )}
    </div>
  );
}
