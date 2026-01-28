import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  // Load from local storage or default to 'EN'
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    const saved = localStorage.getItem('appLanguage');
    return saved ? JSON.parse(saved) : { code: 'EN', label: 'English' };
  });

  const availableLanguages = [
    { code: 'EN', label: 'English' },
    { code: 'HI', label: 'Hindi' },
    { code: 'MR', label: 'Marathi' }
  ];

  const changeLanguage = (langCode) => {
    const selected = availableLanguages.find(l => l.code === langCode);
    if (selected) {
      setCurrentLanguage(selected);
      localStorage.setItem('appLanguage', JSON.stringify(selected));
      // In a real app with i18n, you would trigger the language change here
      // For now, we simulate the effect
      console.log(`Language changed to ${selected.label}`);
    }
  };

  // Simple translation helper mock
  const t = (key, defaultText) => {
    // This is where you would look up translations based on key and currentLanguage.code
    return defaultText;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, changeLanguage, availableLanguages, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
