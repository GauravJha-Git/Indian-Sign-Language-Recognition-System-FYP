import React from 'react';
import { Languages } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SupportedLanguages {
  [category: string]: {
    [languageName: string]: string;
  };
}

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
  supportedLanguages: SupportedLanguages | null;
}

export function LanguageSelector({ selectedLanguage, onLanguageChange, disabled, supportedLanguages }: LanguageSelectorProps) {
  return (
    <div className="flex flex-col space-y-3 w-full">
      <label className="text-[12px] font-medium text-textSecondary uppercase tracking-wider flex items-center space-x-2">
        <Languages className="w-4 h-4 text-textSecondary" />
        <span>Output Language</span>
      </label>
      <div className="relative">
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          disabled={disabled || !supportedLanguages}
          className={cn(
            "w-full h-12 px-4 rounded-lg appearance-none outline-none transition-colors cursor-pointer",
            "bg-background border border-border text-textPrimary text-[14px] font-medium",
            "hover:border-textSecondary/50 focus:border-primary focus:ring-1 focus:ring-primary",
            (disabled || !supportedLanguages) && "opacity-50 cursor-not-allowed"
          )}
        >
          {supportedLanguages ? (
            Object.entries(supportedLanguages).map(([category, languages]) => (
              <optgroup key={category} label={category}>
                {Object.keys(languages).map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </optgroup>
            ))
          ) : (
            <option value="English">Loading languages...</option>
          )}
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
