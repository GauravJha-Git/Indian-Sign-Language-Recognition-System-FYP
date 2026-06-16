import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, Loader2, AlertCircle } from 'lucide-react';
import { UploadZone } from './components/UploadZone';
import { LanguageSelector } from './components/LanguageSelector';
import { PredictionResult } from './components/PredictionResult';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';

const API_BASE_URL = 'http://localhost:8000';

interface PredictionResponse {
  original_prediction: string;
  translated_text: string;
  selected_language: string;
  language_code: string;
  confidence: number;
  audio_url: string;
}

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("English");
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState('');

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);
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
      // Simulate loading states for better UX
      setTimeout(() => setStatusText('Analyzing gestures...'), 1500);
      setTimeout(() => setStatusText('Translating prediction...'), 3000);
      setTimeout(() => setStatusText('Generating speech...'), 4500);

      const response = await axios.post<PredictionResponse>(`${API_BASE_URL}/predict`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult({
        ...response.data,
        audio_url: `${API_BASE_URL}${response.data.audio_url}`
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'An error occurred during prediction. Please ensure the backend is running.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-textPrimary selection:bg-primary/30">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🤟</span>
            <span className="font-bold text-lg tracking-tight">ISL Translator</span>
          </div>
          <div className="flex items-center space-x-6 text-sm font-medium">
            <div className="flex items-center space-x-2 text-textSecondary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
              </span>
              <span>API Ready</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primaryAccent px-3 py-1 rounded-full text-sm font-medium mb-4 border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Recognition</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-textSecondary">
              Indian Sign Language <br className="hidden sm:block" /> Translator
            </h1>
            <p className="mt-6 text-lg text-textSecondary max-w-2xl mx-auto">
              Upload a sign language video and instantly convert it into text and speech using our advanced AI model.
            </p>
          </motion.div>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="shadow-2xl shadow-black/50 border-border/50">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Upload Video</h3>
                <p className="text-sm text-textSecondary">Select a clear video showing the sign gestures.</p>
              </div>

              <UploadZone 
                onFileSelect={handleFileSelect} 
                selectedFile={selectedFile} 
                onClear={clearSelection} 
              />

              <LanguageSelector 
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                disabled={isUploading}
              />

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="mt-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-start space-x-3 text-error"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </motion.div>
              )}

              <AnimatePresence>
                {selectedFile && !result && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 overflow-hidden"
                  >
                    <Button 
                      onClick={handlePredict} 
                      disabled={isUploading}
                      className="w-full h-14 text-base font-semibold shadow-lg shadow-primary/20"
                    >
                      {isUploading ? (
                        <div className="flex items-center space-x-3">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{statusText}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Activity className="w-5 h-5" />
                          <span>Translate Sign Language</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {result && !isUploading && (
            <PredictionResult 
              originalPrediction={result.original_prediction}
              translatedText={result.translated_text}
              selectedLanguage={result.selected_language}
              confidence={result.confidence} 
              audioUrl={result.audio_url} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
