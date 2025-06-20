import React, { useState } from 'react';
import { useTranslation } from '../contexts/TranslationContext';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'nl', name: 'Nederlands' },
];

interface LanguageSelectorProps {
  onSelectLanguage?: (langCode: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onSelectLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLanguage, setLanguage } = useTranslation();
  
  const selectedLanguage = languages.find(lang => lang.code === currentLanguage) || languages[5]; // Default to Portuguese

  const handleSelect = (language: typeof languages[0]) => {
    setLanguage(language.code);
    if (onSelectLanguage) {
      onSelectLanguage(language.code);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
        >
          {selectedLanguage.name}
          <svg
            className="-mr-1 ml-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            {languages.map((language) => (
              <button
                key={language.code}
                className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 w-full text-left"
                role="menuitem"
                tabIndex={-1}
                id={`menu-item-${language.code}`}
                onClick={() => handleSelect(language)}
              >
                {language.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

