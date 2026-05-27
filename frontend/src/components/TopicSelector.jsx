import React from 'react';
import { Tag } from 'lucide-react';

const TOPICS = [
  { id: 'free', label: 'Livre', emoji: '💬' },
  { id: 'travel', label: 'Viagem', emoji: '✈️' },
  { id: 'work', label: 'Trabalho', emoji: '💼' },
  { id: 'education', label: 'Educação', emoji: '📚' },
  { id: 'health', label: 'Saúde', emoji: '🏥' },
  { id: 'sports', label: 'Esportes', emoji: '⚽' },
  { id: 'technology', label: 'Informática', emoji: '💻' },
  { id: 'leisure', label: 'Lazer', emoji: '🎮' },
  { id: 'objects', label: 'Objetos', emoji: '🪑' },
  { id: 'animals', label: 'Animais', emoji: '🐾' },
  { id: 'food', label: 'Comida', emoji: '🍕' },
  { id: 'family', label: 'Família', emoji: '👨‍👩‍👧' },
  { id: 'shopping', label: 'Compras', emoji: '🛒' },
  { id: 'movies', label: 'Filmes/Séries', emoji: '🎬' },
  { id: 'music', label: 'Música', emoji: '🎵' },
];

export default function TopicSelector({ selectedTopic, onSelectTopic }) {
  return (
    <div className="flex flex-wrap gap-1.5 p-2">
      {TOPICS.map((topic) => (
        <button
          key={topic.id}
          onClick={() => onSelectTopic(topic.id)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 active:scale-95
            ${selectedTopic === topic.id
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-800'
            }`}
        >
          {topic.emoji} {topic.label}
        </button>
      ))}
    </div>
  );
}
