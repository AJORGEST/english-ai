import React from 'react';

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
  const current = TOPICS.find(t => t.id === selectedTopic) || TOPICS[0];

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">🎯 Tema:</span>
      <select
        value={selectedTopic}
        onChange={(e) => onSelectTopic(e.target.value)}
        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none cursor-pointer"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
      >
        {TOPICS.map((topic) => (
          <option key={topic.id} value={topic.id}>
            {topic.emoji} {topic.label}
          </option>
        ))}
      </select>
    </div>
  );
}
