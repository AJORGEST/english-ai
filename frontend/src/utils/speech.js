/**
 * Web Speech API wrappers for SpeechRecognition and SpeechSynthesis.
 */

// Speech Recognition (Speech-to-Text)
export const getSpeechRecognition = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    return null;
  }
  
  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US'; // We transcribe student speech, which is in English
  
  return recognition;
};

// Speech Synthesis (Text-to-Speech)
export const speakText = (text, options = {}) => {
  const { accent = 'US', rate = 1.0, onStart, onEnd, onError } = options;
  
  if (!window.speechSynthesis) {
    if (onError) onError('Speech synthesis not supported in this browser.');
    return;
  }
  
  // Cancel current speech if any
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = parseFloat(rate);
  
  // Find a voice based on language and accent selection
  const voices = window.speechSynthesis.getVoices();
  let targetLang = accent === 'UK' ? 'en-GB' : 'en-US';
  
  // Find a matching voice
  let voice = voices.find(v => v.lang.startsWith(targetLang));
  
  // Fallbacks
  if (!voice) {
    voice = voices.find(v => v.lang.startsWith('en'));
  }
  
  if (voice) {
    utterance.voice = voice;
  }
  
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  if (onError) utterance.onerror = onError;
  
  window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

export const getAvailableVoices = () => {
  if (!window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
};
