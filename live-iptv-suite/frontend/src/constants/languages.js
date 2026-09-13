export const DEFAULT_LANGUAGE = 'tamil';

export const LANGUAGE_METADATA = {
  tamil: { label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', color: '#00e5ff' },
  english: { label: 'English', native: 'English', flag: '🇬🇧', color: '#38bdf8' },
  hindi: { label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', color: '#f97316' },
  telugu: { label: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', color: '#e11d48' },
  kannada: { label: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', color: '#c026d3' },
  malayalam: { label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳', color: '#10b981' },
  'english/hindi': { label: 'Eng / Hindi', native: 'Bilingual', flag: '🌐', color: '#a855f7' },
  french: { label: 'French', native: 'Français', flag: '🇫🇷', color: '#3b82f6' },
  spanish: { label: 'Spanish', native: 'Español', flag: '🇪🇸', color: '#eab308' },
  german: { label: 'German', native: 'Deutsch', flag: '🇩🇪', color: '#64748b' },
};

export const getLanguageDisplay = (code = '') => {
  const normalized = (code || '').toLowerCase().trim();
  return LANGUAGE_METADATA[normalized] || {
    label: code ? code.toUpperCase() : 'UNKNOWN',
    native: code ? code.toUpperCase() : '',
    flag: '📺',
    color: '#00e5ff',
  };
};
