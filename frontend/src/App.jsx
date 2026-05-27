import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Moon, 
  Sun, 
  BookOpen, 
  Layers, 
  AlertCircle,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

import ChatWindow from './components/ChatWindow';
import ControlPanel from './components/ControlPanel';
import StatsDashboard from './components/StatsDashboard';
import Translator from './components/Translator';
import TextReader from './components/TextReader';
import TopicSelector from './components/TopicSelector';
import { 
  getSpeechRecognition, 
  speakText, 
  stopSpeaking,
  getAvailableVoices 
} from './utils/speech';

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';

export default function App() {
  // App States
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({
    total_sentences: 0,
    correct_sentences: 0,
    incorrect_sentences: 0,
    accuracy_rate: 100,
    revision_list: []
  });
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('free');
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState(null);
  
  // Voice Config States
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechAccent, setSpeechAccent] = useState('US');
  
  // System States
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [apiConfigError, setApiConfigError] = useState(false);
  const [quizScore, setQuizScore] = useState(() => {
    return parseInt(localStorage.getItem('quizScore') || '0', 10);
  });
  const [darkTheme, setDarkTheme] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const recognitionRef = useRef(null);

  // Sync theme with HTML document element
  useEffect(() => {
    if (darkTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkTheme]);

  // Load initial history and stats
  useEffect(() => {
    fetchHistory();
    fetchStats();
    
    // Initialize voices (some browsers need this event)
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Just trigger refresh to load list
      };
    }
  }, []);

  // API Call: Fetch History
  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const res = await fetch(`${API_BASE}/history`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setApiConfigError(false);
      } else {
        const data = await res.json();
        if (data.error === 'Configuração Pendente') {
          setApiConfigError(true);
        }
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // API Call: Fetch Stats
  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const res = await fetch(`${API_BASE}/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  // API Call: Send Message
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // 1. Instantly append student message locally to keep UI snappy
    const tempStudentId = Date.now();
    const tempStudentMsg = {
      id: tempStudentId,
      sender: 'student',
      text: text,
      is_correct: null,
      corrections: [],
      explanation: null,
      created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempStudentMsg]);
    setIsTyping(true);

    try {
      // 2. Post to backend chat endpoint
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, topic: selectedTopic })
      });

      if (res.ok) {
        const data = await res.json();
        
        // 3. Refresh entire history and stats to sync with server SQLite database
        await fetchHistory();
        await fetchStats();
        
        // 4. Optionally auto-speak the teacher's reply if synthesis is available
        const speakOption = localStorage.getItem('auto_speak') === 'true';
        if (speakOption && data.teacher_reply) {
          const teacherMsg = {
            id: Date.now() + 1, // temporary ID or will be read from history
            sender: 'teacher',
            text: data.teacher_reply
          };
          handleSpeakMessage(teacherMsg);
        }
      } else {
        const data = await res.json();
        if (res.status === 400 && data.error === 'Configuração Pendente') {
          setApiConfigError(true);
        } else {
          // General error
          setMessages(prev => [
            ...prev,
            {
              id: Date.now() + 2,
              sender: 'teacher',
              text: 'Ops! Tive um problema de comunicação. Poderia tentar enviar novamente?'
            }
          ]);
        }
      }
    } catch (err) {
      console.error('Send message error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'teacher',
          text: 'Não consegui conectar ao servidor do professor. Verifique se o backend está rodando.'
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // API Call: Clear History
  const handleClearHistory = async () => {
    if (!window.confirm('Tem certeza que deseja apagar todo o histórico de conversas e progresso?')) {
      return;
    }
    
    try {
      stopSpeaking();
      setCurrentlySpeakingId(null);
      
      const res = await fetch(`${API_BASE}/clear`, { method: 'POST' });
      if (res.ok) {
        setMessages([]);
        setStats({
          total_sentences: 0,
          correct_sentences: 0,
          incorrect_sentences: 0,
          accuracy_rate: 100,
          revision_list: []
        });
      }
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  // Speech Recognition (Microphone Speech-to-Text)
  const handleStartRecording = () => {
    const recognition = getSpeechRecognition();
    if (!recognition) {
      alert('Seu navegador não oferece suporte para reconhecimento de fala HTML5.');
      return;
    }

    // Stop speaking if playing
    stopSpeaking();
    setCurrentlySpeakingId(null);

    setIsRecording(true);
    setInterimTranscript('');

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      
      setInterimTranscript(interim || final);
      if (final) {
        setInputValue(prev => {
          const spacing = prev.length > 0 && !prev.endsWith(' ') ? ' ' : '';
          return prev + spacing + final;
        });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript('');
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setInterimTranscript('');
      if (event.error === 'not-allowed') {
        alert('Acesso ao microfone foi negado. Por favor, libere a permissão nas configurações do navegador.');
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Speech Synthesis (Text-to-Speech)
  const handleSpeakMessage = (msg) => {
    setCurrentlySpeakingId(msg.id);
    
    speakText(msg.text, {
      accent: speechAccent,
      rate: speechRate,
      onStart: () => {},
      onEnd: () => setCurrentlySpeakingId(null),
      onError: (err) => {
        console.error('Speech synthesis error:', err);
        setCurrentlySpeakingId(null);
      }
    });
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setCurrentlySpeakingId(null);
  };

  const handleSuggestedReplyClick = (reply) => {
    setInputValue(reply);
  };

  const handleQuizAnswer = (isCorrect, replyText) => {
    if (isCorrect) {
      const newScore = quizScore + 10;
      setQuizScore(newScore);
      localStorage.setItem('quizScore', newScore.toString());
    }
    // Auto-send the correct answer as next message
    if (isCorrect) {
      setTimeout(() => handleSendMessage(replyText), 1500);
    }
  };

  const handleRetrySentence = (sentence) => {
    // Pre-fills input box so student can rewrite/correct and try again
    setInputValue(sentence);
  };

  // Check SpeechRecognition support in browser
  const micSupported = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/50 dark:border-slate-800/40 px-4 py-3 sm:px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-600 rounded-xl text-white shadow-md shadow-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100 m-0 leading-none">
                English AI
              </h1>
              <span className="text-[10px] text-emerald-500 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                Professor Online
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            {apiConfigError && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50">
                <AlertCircle className="w-3.5 h-3.5" />
                Configuração pendente
              </span>
            )}

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkTheme(!darkTheme)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none"
              title={darkTheme ? "Modo Claro" : "Modo Escuro"}
            >
              {darkTheme ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API CONFIG ERROR MODAL / BANNER */}
        {apiConfigError && (
          <div className="lg:col-span-3 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/10 border-2 border-dashed border-rose-300 dark:border-rose-900/50 p-6 rounded-2xl flex flex-col md:flex-row items-center gap-6 shadow-sm mb-2">
            <div className="p-4 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-2xl flex-shrink-0">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div className="space-y-2 text-center md:text-left flex-1">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Configuração do Gemini Pendente</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Você precisa configurar a sua chave de API do Gemini no backend para o professor começar a te ensinar.
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-1 space-y-1 font-mono">
                <div>1. Abra o arquivo <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">backend/.env</code> no seu editor.</div>
                <div>2. Substitua <code className="bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px]">SUA_CHAVE_API_AQUI</code> pela sua chave do Google AI Studio.</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <a 
                href="https://aistudio.google.com/" 
                target="_blank" 
                rel="noreferrer"
                className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 focus:outline-none"
              >
                Obter Chave Grátis
                <ExternalLink className="w-4 h-4" />
              </a>
              <button 
                onClick={fetchHistory}
                className="border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all focus:outline-none"
              >
                Já Configurei, Testar Conexão
              </button>
            </div>
          </div>
        )}

        {/* Left Column: Chat feed & controls */}
        <div className="lg:col-span-2 flex flex-col h-[calc(100vh-180px)] lg:h-[calc(100vh-140px)] min-h-[500px] space-y-2">
          {/* Topic Selector */}
          <div className="flex-shrink-0 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/40 shadow-sm">
            <TopicSelector selectedTopic={selectedTopic} onSelectTopic={setSelectedTopic} />
          </div>

          {/* Chat box container */}
          <div className="flex-1 min-h-0">
            <ChatWindow 
              messages={messages}
              isTyping={isTyping}
              onSuggestedReplyClick={handleSuggestedReplyClick}
              onSpeakMessage={handleSpeakMessage}
              currentlySpeakingId={currentlySpeakingId}
              onStopSpeaking={handleStopSpeaking}
              quizScore={quizScore}
              onQuizAnswer={handleQuizAnswer}
            />
          </div>

          {/* User inputs & microphones */}
          <div className="flex-shrink-0">
            <ControlPanel 
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSendMessage={handleSendMessage}
              isTyping={isTyping}
              isRecording={isRecording}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              interimTranscript={interimTranscript}
              speechRate={speechRate}
              setSpeechRate={setSpeechRate}
              speechAccent={speechAccent}
              setSpeechAccent={setSpeechAccent}
              onClearHistory={handleClearHistory}
              micSupported={micSupported}
            />
          </div>
        </div>

        {/* Right Column: Translator & Metrics */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-[calc(100vh-140px)] overflow-y-auto hidden lg:flex">
          <Translator />
          <TextReader />
          <div className="glass-panel rounded-2xl border border-slate-200/60 dark:border-slate-800/40 p-5 shadow-sm flex-1 overflow-hidden">
            <StatsDashboard 
              stats={stats}
              onRetrySentence={handleRetrySentence}
              isLoadingStats={isLoadingStats}
              onRefresh={fetchStats}
            />
          </div>
        </div>

      </main>

      {/* Floating button for mobile dashboard drawer */}
      <div className="lg:hidden fixed bottom-24 right-4 z-40">
        <button 
          onClick={() => {
            // Simple overlay display using a full screen backdrop or toggle
            const dashboardEl = document.getElementById('mobile-dashboard');
            if (dashboardEl) {
              dashboardEl.classList.toggle('hidden');
            }
          }}
          className="p-4 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 transition-all flex items-center justify-center focus:outline-none"
        >
          <BookOpen className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile dashboard overlay */}
      <div 
        id="mobile-dashboard"
        className="hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm lg:hidden flex justify-end animate-fadeIn"
      >
        <div className="w-[85vw] max-w-[360px] h-full bg-white dark:bg-slate-950 p-6 overflow-hidden flex flex-col relative shadow-2xl">
          <button 
            onClick={() => {
              const dashboardEl = document.getElementById('mobile-dashboard');
              if (dashboardEl) {
                dashboardEl.classList.add('hidden');
              }
            }}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none text-xl font-bold"
          >
            ✕
          </button>
          
          <div className="flex-1 mt-4 overflow-hidden">
            <StatsDashboard 
              stats={stats}
              onRetrySentence={(sentence) => {
                handleRetrySentence(sentence);
                const dashboardEl = document.getElementById('mobile-dashboard');
                if (dashboardEl) {
                  dashboardEl.classList.add('hidden');
                }
              }}
              isLoadingStats={isLoadingStats}
              onRefresh={fetchStats}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
