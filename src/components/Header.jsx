import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, Calendar, Monitor, Type } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { fonts, currentFont, changeFont, colors, currentColor, changeColor, mode, changeMode } = useTheme();

  // State
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Refs for click outside
  const themeRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setIsThemeOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const token = localStorage.getItem('ks_shop_token');
          const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
          const response = await fetch(`${apiBase}/dashboard/search?q=${searchQuery}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            setSearchResults(data.results);
            setShowResults(true);
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 h-16 px-4 flex items-center justify-between sticky top-0 z-[100] shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button onClick={toggleSidebar} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg lg:hidden text-gray-600 dark:text-gray-300">
          <Menu size={20} />
        </button>
        
        {/* Search */}
        <div className="relative" ref={searchRef}>
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 w-64 lg:w-96 focus-within:ring-2 focus-within:ring-accent/20 focus-within:border-accent transition-all">
            <Search size={18} className={`${isSearching ? 'animate-pulse text-accent' : 'text-gray-400 dark:text-gray-300'}`} />
            <input 
              type="text" 
              placeholder="Search medicines, invoices, or records..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-100"
            />
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-zoom-in z-[110]">
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          navigate(result.link);
                          setShowResults(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            result.type === 'medicine' ? 'bg-blue-50 text-blue-500' :
                            result.type === 'invoice' ? 'bg-green-50 text-green-500' :
                            result.type === 'supplier' ? 'bg-purple-50 text-purple-500' :
                            'bg-orange-50 text-orange-500'
                          }`}>
                            <Search size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-primary transition-colors">{result.title}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">{result.subtitle}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search size={20} className="text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-400">No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-t border-gray-100 dark:border-gray-600">
                 <p className="text-[10px] text-gray-400 font-bold uppercase text-center">Press Enter to see all results</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Theme & Font Switcher */}
        <div className="relative" ref={themeRef}>
          <button 
            onClick={() => setIsThemeOpen(!isThemeOpen)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors flex items-center gap-2"
            title="Theme Settings"
          >
            <Monitor size={20} />
            <span className="hidden md:block text-xs font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Theme</span>
          </button>

          {isThemeOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 animate-fade-in z-50 max-h-[80vh] overflow-y-auto custom-scrollbar">
               
               {/* Mode Section */}
               <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                    <Monitor size={14} /> Interface Mode
                  </h4>
                  <div className="flex bg-gray-100 dark:bg-gray-7000 dark:bg-gray-900/50 p-1 rounded-lg">
                    {['light', 'dark', 'system'].map(m => (
                      <button
                        key={m}
                        onClick={() => changeMode(m)}
                        className={`flex-1 py-1.5 text-xs font-bold capitalize rounded-md transition-all ${mode === m ? 'bg-white dark:bg-gray-700 shadow-sm text-primary' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
               </div>

               <div className="border-t border-gray-100 dark:border-gray-700 my-3"></div>

               {/* Color Section */}
               <div className="mb-4">
                 <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                   <Type size={14} /> Color Scheme
                 </h4>
                 <div className="grid grid-cols-5 gap-2">
                   {colors.map((color) => (
                     <button
                       key={color.name}
                       onClick={() => changeColor(color)}
                       className={`w-8 h-8 rounded-full border-2 transition-all ${currentColor.name === color.name ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent hover:scale-105'}`}
                       style={{ backgroundColor: color.primary }}
                       title={color.name}
                     />
                   ))}
                 </div>
                 <p className="text-xs text-gray-400 mt-2 text-right">{currentColor.name}</p>
               </div>

               <div className="border-t border-gray-100 dark:border-gray-700 my-3"></div>

               {/* Font Section */}
               <div>
                  <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2">
                   <Type size={14} /> Font Family
                 </h4>
                 <div className="space-y-1">
                   {fonts.map((font) => (
                     <button
                       key={font.name}
                       onClick={() => changeFont(font)}
                       className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex justify-between items-center
                         ${currentFont.name === font.name ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                     >
                       <span style={{ fontFamily: font.value }}>{font.name}</span>
                       {currentFont.name === font.name && <div className="w-2 h-2 rounded-full bg-accent"></div>}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </div>

        {/* Date Display (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-2 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-600">
          <Calendar size={16} />
          <span className="text-xs font-medium">{formatDate()}</span>
        </div>

        {/* Notifications */}
        <button 
          onClick={() => navigate('/notifications')}
          className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
        >
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-800"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
