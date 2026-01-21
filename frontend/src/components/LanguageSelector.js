import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Check, Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = window.location.origin;

const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
];

const LanguageSelector = ({ 
  selectedLanguage = 'en', 
  onLanguageChange, 
  showLabel = true,
  size = 'md' // sm, md, lg
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === selectedLanguage) || LANGUAGES[0];

  const handleSelect = async (langCode) => {
    if (langCode === selectedLanguage) {
      setIsOpen(false);
      return;
    }
    
    setLoading(true);
    
    // Save preference to localStorage
    localStorage.setItem('preferredLanguage', langCode);
    
    if (onLanguageChange) {
      await onLanguageChange(langCode);
    }
    
    setLoading(false);
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.language-selector')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2 text-base',
    lg: 'px-4 py-3 text-lg'
  };

  return (
    <div className="language-selector relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={`flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition ${sizeClasses[size]} ${loading ? 'opacity-50' : ''}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Globe className="w-4 h-4 text-gray-500" />
        )}
        <span className="font-medium">{currentLang.flag}</span>
        {showLabel && (
          <span className="text-gray-700">{currentLang.nativeName}</span>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 max-h-80 overflow-y-auto">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500 uppercase">Select Language</p>
          </div>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelect(lang.code)}
              className={`w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition ${
                lang.code === selectedLanguage ? 'bg-purple-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{lang.flag}</span>
                <div className="text-left">
                  <p className={`font-medium ${lang.code === selectedLanguage ? 'text-purple-700' : 'text-gray-900'}`}>
                    {lang.nativeName}
                  </p>
                  <p className="text-xs text-gray-500">{lang.name}</p>
                </div>
              </div>
              {lang.code === selectedLanguage && (
                <Check className="w-4 h-4 text-purple-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Hook for using translation
export const useTranslation = () => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('preferredLanguage') || 'en';
  });
  const [isTranslating, setIsTranslating] = useState(false);

  const translateText = async (text, targetLang = language) => {
    if (targetLang === 'en' || !text) return text;
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/translate/translate`, {
        text,
        target_lang: targetLang,
        source_lang: 'en'
      });
      
      if (response.data.success) {
        return response.data.translated;
      }
      return text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const translateBatch = async (texts, targetLang = language) => {
    if (targetLang === 'en' || !texts.length) return texts;
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/translate/translate/batch`, {
        texts,
        target_lang: targetLang,
        source_lang: 'en'
      });
      
      if (response.data.success) {
        return response.data.translations;
      }
      return texts;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    }
  };

  const translateQuestionObject = async (question, targetLang = language) => {
    if (targetLang === 'en' || !question) return question;
    
    try {
      // Prepare texts to translate: question + options
      const textsToTranslate = [question.question_text || question.question];
      
      // Handle options formats (array of strings, array of objects, or option_a/b/c/d keys)
      let optionKeys = [];
      let optionsArray = [];
      
      if (Array.isArray(question.options)) {
        // Array format
        question.options.forEach(opt => {
          if (typeof opt === 'string') {
            textsToTranslate.push(opt);
          } else if (typeof opt === 'object' && opt.text) {
            textsToTranslate.push(opt.text);
          } else if (typeof opt === 'object' && opt.value) {
            textsToTranslate.push(opt.value);
          }
        });
      } else {
        // Key format (option_a, option_b...)
        ['option_a', 'option_b', 'option_c', 'option_d'].forEach(key => {
          if (question[key]) {
            textsToTranslate.push(question[key]);
            optionKeys.push(key);
          }
        });
      }

      // Add explanation if exists
      if (question.explanation) {
        textsToTranslate.push(question.explanation);
      }
      
      // Call batch translation
      const response = await axios.post(`${BACKEND_URL}/api/translate/translate/batch`, {
        texts: textsToTranslate,
        target_lang: targetLang,
        source_lang: 'en'
      });
      
      if (response.data.success) {
        const translations = response.data.translations;
        const translatedQuestion = { ...question };
        
        // Map back translations
        let tIndex = 0;
        translatedQuestion.question_text = translations[tIndex++]; // or .question based on original
        if (question.question) translatedQuestion.question = translatedQuestion.question_text;
        
        if (Array.isArray(question.options)) {
          translatedQuestion.options = question.options.map(opt => {
            const translatedText = translations[tIndex++];
            if (typeof opt === 'string') return translatedText;
            if (typeof opt === 'object') return { ...opt, text: translatedText, value: translatedText };
            return opt;
          });
        } else {
          optionKeys.forEach(key => {
            translatedQuestion[key] = translations[tIndex++];
          });
        }
        
        if (question.explanation) {
          translatedQuestion.explanation = translations[tIndex++];
        }
        
        return translatedQuestion;
      }
      return question;
    } catch (error) {
      console.error('Question object translation error:', error);
      return question;
    }
  };

  const translateQuestion = async (questionId, targetLang = language) => {
    if (targetLang === 'en') return null;
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/translate/translate/question`, {
        question_id: questionId,
        target_lang: targetLang
      });
      
      if (response.data.success) {
        return response.data.question;
      }
      return null;
    } catch (error) {
      console.error('Question translation error:', error);
      return null;
    }
  };

  const changeLanguage = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  return {
    language,
    setLanguage: changeLanguage,
    isTranslating,
    setIsTranslating,
    translateText,
    translateBatch,
    translateQuestion,
    translateQuestionObject,
    LANGUAGES
  };
};

export default LanguageSelector;
