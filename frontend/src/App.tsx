import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, Activity, Loader2, AlertCircle, CheckCircle, Circle, Sun, Moon } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { UploadZone } from './components/UploadZone';
import { LanguageSelector } from './components/LanguageSelector';
import type { SupportedLanguages } from './components/LanguageSelector';
import { PredictionResult } from './components/PredictionResult';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';

const API_BASE_URL = 'http://localhost:8000';

interface PredictionResponse {
  original_prediction: string;
  refined_prediction: string;
  translated_text: string;
  selected_language: string;
  language_code: string;
  translation_source: string;
  confidence: number;
  audio_url: string;
}

function ProcessTimeline({ statusText, result }: { statusText: string; result: any }) {
  const steps = [
    { id: 'upload', label: 'Upload' },
    { id: 'recognition', label: 'Recognition' },
    { id: 'translation', label: 'Translation' },
    { id: 'audio', label: 'Audio' }
  ];

  const getCurrentStepIndex = () => {
    if (result) return 4;
    if (statusText === 'Extracting frames...') return 1;
    if (statusText === 'Analyzing gestures...') return 1;
    if (statusText === 'Translating prediction...') return 2;
    if (statusText === 'Generating speech...') return 3;
    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-4 px-4 h-12">
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        return (
          <div key={step.id} className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center mb-1 h-6 w-6">
              {isCompleted ? (
                <CheckCircle className="w-5 h-5 text-primary" />
              ) : isCurrent ? (
                <Loader2 className="w-5 h-5 text-textPrimary animate-spin" />
              ) : (
                <Circle className="w-5 h-5 text-textSecondary/30" />
              )}
            </div>
            <span className={`text-[11px] uppercase tracking-wider font-medium ${isCompleted ? 'text-primary' : isCurrent ? 'text-textPrimary' : 'text-textSecondary/50'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguages | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');

  // Fetch languages on mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/languages`);
        setSupportedLanguages(response.data);
      } catch (err) {
        console.error("Failed to fetch languages", err);
      }
    };
    fetchLanguages();
  }, []);

  // Theme Logic
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) return savedTheme === 'dark';
      return true; // Default to dark mode
    }
    return true;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
    toast.success('Video uploaded successfully');
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
  };

  const handlePredict = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setResult(null);
    setStatusText('Extracting frames...');

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('language', selectedLanguage);

    try {
      setTimeout(() => setStatusText('Analyzing gestures...'), 1500);
      setTimeout(() => setStatusText('Translating prediction...'), 3000);
      setTimeout(() => {
        setStatusText('Generating speech...');
        if (selectedLanguage !== 'English') {
          toast.success('Translation generated');
        }
      }, 4500);

      const response = await axios.post<PredictionResponse>(`${API_BASE_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult({
        ...response.data,
        audio_url: `${API_BASE_URL}${response.data.audio_url}`
      });
      toast.success('Recognition completed');
      toast.success('Audio generated');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred during prediction.');
      toast.error('Processing failed');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const translateInstant = async () => {
      if (!result || isUploading || isTranslating) return;
      if (result.selected_language === selectedLanguage) return;

      setIsTranslating(true);
      setError(null);

      const formData = new FormData();
      formData.append('text', result.refined_prediction);
      formData.append('language', selectedLanguage);

      try {
        const response = await axios.post(`${API_BASE_URL}/translate`, formData);
        setResult(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            translated_text: response.data.translated_text,
            selected_language: response.data.selected_language,
            language_code: response.data.language_code,
            translation_source: response.data.translation_source,
            audio_url: `${API_BASE_URL}${response.data.audio_url}`
          };
        });
        toast.success(`Language changed to ${selectedLanguage}`);
        toast.success('Translation updated');
      } catch (err: any) {
        console.error(err);
        setError('Failed to switch language.');
        toast.error('Translation failed');
      } finally {
        setIsTranslating(false);
      }
    };

    translateInstant();
  }, [selectedLanguage]); 

  // Fixed container sizes for rigid layout
  return (
    <div className="h-screen w-screen overflow-hidden bg-background text-textPrimary selection:bg-primary/30 font-sans flex flex-col">
      <Toaster theme={isDark ? 'dark' : 'light'} position="top-right" duration={3000} />
      
      {/* Navbar: Fixed 64px height */}
      <nav className="h-16 w-full border-b border-border bg-surface shrink-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Languages className="w-5 h-5 text-textPrimary" />
            <span className="font-semibold text-[15px] tracking-tight">Indian Sign Language Recognition System</span>
          </div>
          <div className="flex items-center space-x-2 text-[13px] font-medium text-textSecondary bg-background px-3 py-1.5 rounded-md border border-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
            <span>System Active</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area: Fills remaining height */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col items-center">
        
        {/* Timeline Space reserved regardless of state */}
        <div className="w-full h-16 shrink-0 flex items-center justify-center">
          <AnimatePresence>
            {(isUploading || result) && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="w-full"
              >
                <ProcessTimeline statusText={statusText} result={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2-Column Grid Area */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-160px)]">
          
          {/* Left Column (Upload & Controls): Fixed Structure */}
          <div className="lg:col-span-5 h-full flex flex-col space-y-4 shrink-0">
            <Card className="border-border bg-card shadow-sm rounded-xl shrink-0">
              <CardContent className="p-4 sm:p-6">
                <UploadZone 
                  onFileSelect={handleFileSelect} 
                  selectedFile={selectedFile} 
                  onClear={clearSelection} 
                />

                <div className="h-4"></div> {/* Spacer */}

                <Button 
                  onClick={handlePredict} 
                  disabled={isUploading || !selectedFile}
                  className="w-full h-12 text-[15px] font-medium bg-primary text-white hover:bg-primaryHover rounded-lg transition-colors"
                >
                  {isUploading ? (
                    <div className="flex items-center space-x-3">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{statusText}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5" />
                      <span>Process Video</span>
                    </div>
                  )}
                </Button>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg flex items-start space-x-3 text-error"
                  >
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                  </motion.div>
                )}

              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm rounded-xl relative overflow-hidden shrink-0">
              {isTranslating && (
                <div className="absolute inset-0 z-10 bg-card/80 flex items-center justify-center">
                  <div className="flex items-center space-x-2 text-primary">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium text-[13px] uppercase tracking-wider">Translating</span>
                  </div>
                </div>
              )}
              <CardContent className="p-4 sm:p-6">
                <LanguageSelector 
                  supportedLanguages={supportedLanguages}
                  selectedLanguage={selectedLanguage}
                  onLanguageChange={setSelectedLanguage}
                  disabled={isUploading || isTranslating}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column (Results): Fixed Height */}
          <div className="lg:col-span-7 h-full flex flex-col shrink-0 relative">
            <AnimatePresence mode="wait">
              {!result && !isUploading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center w-full h-full"
                >
                  <Card className="w-full max-w-sm border border-border bg-card shadow-sm rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-surface border border-border flex items-center justify-center mb-4">
                      <Activity className="w-6 h-6 text-textSecondary" />
                    </div>
                    <h3 className="text-[16px] font-medium text-textPrimary mb-2">Awaiting Video Input</h3>
                    <p className="text-[13px] text-textSecondary/80">Upload a sign language video to begin recognition.</p>
                  </Card>
                </motion.div>
              ) : isUploading ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center w-full h-full"
                >
                  <Card className="w-full max-w-sm border border-border bg-card shadow-sm rounded-xl p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-surface border border-border">
                      <Loader2 className="w-6 h-6 text-textPrimary animate-spin" />
                    </div>
                    <h3 className="text-[16px] font-medium text-textPrimary mb-1">{statusText}</h3>
                    <p className="text-[13px] text-textSecondary/80">Please wait while the model processes the video.</p>
                  </Card>
                </motion.div>
              ) : result ? (
                <motion.div 
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex flex-col"
                >
                  <PredictionResult 
                    originalPrediction={result.original_prediction}
                    refinedPrediction={result.refined_prediction}
                    translatedText={result.translated_text}
                    selectedLanguage={result.selected_language}
                    translationSource={result.translation_source}
                    confidence={result.confidence} 
                    audioUrl={result.audio_url} 
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Floating Theme Toggle */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 p-3 rounded-full bg-surface border border-border shadow-md text-textSecondary hover:text-textPrimary transition-colors z-50"
        aria-label="Toggle theme"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </motion.button>
    </div>
  );
}

export default App;
