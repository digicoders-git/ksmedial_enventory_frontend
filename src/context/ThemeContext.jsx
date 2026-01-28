import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // --- Fonts ---
  // We use the actual CSS 'font-family' string as the value.
  const fonts = [
    { name: 'Source Sans', value: '"Source Sans Pro", sans-serif' },
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Poppins', value: 'Poppins, sans-serif' },
    { name: 'Roboto', value: 'Roboto, sans-serif' },
    { name: 'Lato', value: 'Lato, sans-serif' },
    { name: 'Montserrat', value: 'Montserrat, sans-serif' },
    { name: 'Open Sans', value: '"Open Sans", sans-serif' },
    { name: 'Nunito', value: 'Nunito, sans-serif' },
    { name: 'Raleway', value: 'Raleway, sans-serif' },
    { name: 'Ubuntu', value: 'Ubuntu, sans-serif' },
    { name: 'Playfair', value: '"Playfair Display", serif' },
  ];
  
  // --- Colors ---
  const colors = [
    { name: 'KS4 Brand', primary: '#007242', accent: '#007242', secondary: '#d92b1c' },
    { name: 'Pharma Green', primary: '#007242', accent: '#007242', secondary: '#005a34' },
    { name: 'Ocean Blue', primary: '#2563EB', accent: '#2563EB', secondary: '#1E40AF' },
    { name: 'Royal Purple', primary: '#7C3AED', accent: '#7C3AED', secondary: '#5B21B6' },
    { name: 'Crimson Red', primary: '#DC2626', accent: '#DC2626', secondary: '#991B1B' },
    { name: 'Sunset Orange', primary: '#EA580C', accent: '#EA580C', secondary: '#9A3412' },
    { name: 'Teal Teal', primary: '#0D9488', accent: '#0D9488', secondary: '#115E59' },
    { name: 'Indigo', primary: '#4F46E5', accent: '#4F46E5', secondary: '#3730A3' },
    { name: 'Hot Pink', primary: '#DB2777', accent: '#DB2777', secondary: '#9D174D' },
    { name: 'Cyan', primary: '#0891B2', accent: '#0891B2', secondary: '#155E75' },
    { name: 'Slate Dark', primary: '#475569', accent: '#475569', secondary: '#1E293B' },
  ];

  // --- State ---
  // Initialize state from localStorage if available, otherwise default to first item
  const [currentFont, setCurrentFont] = useState(() => {
    const savedFont = localStorage.getItem('theme_font');
    if (savedFont) {
      return fonts.find(f => f.name === savedFont) || fonts[0];
    }
    return fonts[0];
  });

  const [currentColor, setCurrentColor] = useState(() => {
    const savedColor = localStorage.getItem('theme_color');
    if (savedColor) {
      return colors.find(c => c.name === savedColor) || colors[0];
    }
    return colors[0];
  });

  // --- Mode (Light/Dark) ---
  const [mode, setMode] = useState(() => localStorage.getItem('theme_mode') || 'light');

  useEffect(() => {
    // Save to LocalStorage
    localStorage.setItem('theme_font', currentFont.name);
    localStorage.setItem('theme_color', currentColor.name);
    localStorage.setItem('theme_mode', mode);

    const root = document.documentElement;
    // Set variables
    root.style.setProperty('--color-primary', currentColor.primary);
    root.style.setProperty('--color-accent', currentColor.accent);
    root.style.setProperty('--color-secondary', currentColor.secondary);
    root.style.setProperty('--font-family', currentFont.value);

    // Dark Mode Logic
    if (mode === 'dark') {
        root.classList.add('dark');
    } else if (mode === 'light') {
        root.classList.remove('dark');
    } else if (mode === 'system') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
             root.classList.add('dark');
        } else {
             root.classList.remove('dark');
        }
    }

    // Hard Override via Style Tag
    const styleId = 'theme-font-override';
    let styleTag = document.getElementById(styleId);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    
    styleTag.innerHTML = `
      html, body, button, input, select, textarea, .font-sans, h1, h2, h3, h4, h5, h6 {
        font-family: ${currentFont.value} !important;
      }
    `;
    
  }, [currentFont, currentColor, mode]); // Added mode dependency

  return (
    <ThemeContext.Provider value={{
      fonts,
      currentFont,
      changeFont: setCurrentFont,
      colors,
      currentColor,
      changeColor: setCurrentColor,
      mode,
      changeMode: setMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
