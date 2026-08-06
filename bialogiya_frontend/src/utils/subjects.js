export const SUBJECTS = [
  'biology', 'chemistry', 'physics', 'math', 'geography', 'history',
  'literature', 'native_language', 'english', 'russian', 'informatics', 'both', 'other',
];

export const SUBJECT_LABELS = {
  biology: 'Biologiya', chemistry: 'Kimyo', physics: 'Fizika', math: 'Matematika',
  geography: 'Geografiya', history: 'Tarix', literature: 'Adabiyot',
  native_language: 'Ona tili', english: 'Ingliz tili', russian: 'Rus tili',
  informatics: 'Informatika', both: 'Biologiya + Kimyo', other: 'Boshqa',
};

export const SUBJECT_ICONS = {
  biology: '🧬', chemistry: '⚗️', physics: '⚛️', math: '📐',
  geography: '🌍', history: '📜', literature: '📖',
  native_language: '🗣️', english: '🇬🇧', russian: '🇷🇺',
  informatics: '💻', both: '🔬', other: '📚',
};

export const SUBJECT_BADGE_CLASSES = {
  biology: 'bg-green-100 text-green-700', chemistry: 'bg-blue-100 text-blue-700',
  physics: 'bg-indigo-100 text-indigo-700', math: 'bg-orange-100 text-orange-700',
  geography: 'bg-teal-100 text-teal-700', history: 'bg-amber-100 text-amber-700',
  literature: 'bg-pink-100 text-pink-700', native_language: 'bg-rose-100 text-rose-700',
  english: 'bg-sky-100 text-sky-700', russian: 'bg-red-100 text-red-700',
  informatics: 'bg-cyan-100 text-cyan-700', both: 'bg-emerald-100 text-emerald-700',
  other: 'bg-purple-100 text-purple-700',
};

export const getSubjectLabel = (subject) => SUBJECT_LABELS[subject] || subject;
export const getSubjectIcon = (subject) => SUBJECT_ICONS[subject] || '📚';
export const getSubjectBadgeClass = (subject) => SUBJECT_BADGE_CLASSES[subject] || SUBJECT_BADGE_CLASSES.other;
