import React from 'react';
import { motion } from 'framer-motion';
import { Globe2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const INDIAN_LANGUAGES = [
  "English", "Hindi", "Bengali", "Tamil", "Telugu", 
  "Marathi", "Gujarati", "Kannada", "Malayalam", 
  "Punjabi", "Urdu", "Odia", "Assamese"
];

export const INTERNATIONAL_LANGUAGES = [
  "French", "German", "Spanish", "Italian", "Portuguese",
  "Dutch", "Russian", "Turkish", "Arabic", "Chinese",
  "Japanese", "Korean"
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
}

export function LanguageSelector({ selectedLanguage, onLanguageChange, disabled }: LanguageSelectorProps) {
  return (
    <div className="flex flex-col space-y-2 w-full mt-4">
      <label className="text-sm font-medium text-textSecondary flex items-center space-x-2">
        <Globe2 className="w-4 h-4 text-primary" />
        <span>Target Output Language</span>
      </label>
      <div className="relative">
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full h-12 px-4 rounded-xl appearance-none outline-none transition-all cursor-pointer",
            "bg-secondary border border-border text-textPrimary text-sm",
            "hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <optgroup label="Indian Languages">
            {INDIAN_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </optgroup>
          <optgroup label="International Languages">
            {INTERNATIONAL_LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </optgroup>
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-textSecondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
