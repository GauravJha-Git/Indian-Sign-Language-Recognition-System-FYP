import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, ArrowRight, MessageSquare, CheckCircle, Languages, Rewind, RotateCcw } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface PredictionResultProps {
  originalPrediction: string;
  refinedPrediction: string;
  translatedText: string;
  selectedLanguage: string;
  translationSource: string;
  confidence: number;
  audioUrl: string;
}

export function PredictionResult({ refinedPrediction, translatedText, selectedLanguage, confidence, audioUrl }: PredictionResultProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.onended = () => setIsPlaying(false);
    }
  }, []);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const replayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const confidencePercentage = (confidence * 100).toFixed(1);
  const dashArray = 283;
  const dashOffset = dashArray - (dashArray * confidence);

  let confidenceText = "Low Confidence";
  if (confidence > 0.85) {
    confidenceText = "High Confidence";
  } else if (confidence > 0.5) {
    confidenceText = "Medium Confidence";
  }

  const isEnglish = selectedLanguage === "English";

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Prediction & Translation Card */}
        <Card className="md:col-span-3 border border-border bg-card shadow-sm rounded-xl overflow-hidden flex flex-col min-h-[260px] max-h-[300px]">
          
          <CardContent className={`p-6 sm:p-8 flex-1 flex flex-col justify-center relative ${!isEnglish ? 'border-b border-border bg-background' : ''}`}>
            <p className="text-[12px] font-medium text-textSecondary uppercase tracking-wider mb-2">
              Prediction {isEnglish ? "" : "(English)"}
            </p>
            <h3 className="text-[32px] font-semibold text-textPrimary leading-tight">
              {refinedPrediction}
            </h3>
          </CardContent>

          {/* Translation Section (Hidden if English) */}
          {!isEnglish && (
            <CardContent className="p-6 sm:p-8 flex-1 flex flex-col justify-center relative">
              <p className="text-[12px] font-medium text-textSecondary uppercase tracking-wider mb-2">
                Translation ({selectedLanguage})
              </p>
              <h2 className="text-[32px] font-semibold text-textPrimary leading-tight">
                {translatedText}
              </h2>
            </CardContent>
          )}
        </Card>

        {/* Confidence Card */}
        <Card className="md:col-span-1 flex flex-col items-center justify-center p-4 border border-border bg-card shadow-sm rounded-xl min-h-[260px] max-h-[300px]">
          <p className="text-[12px] font-medium text-textSecondary uppercase tracking-wider mb-4">Confidence</p>
          
          <div className="relative w-20 h-20 flex items-center justify-center mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle className="text-background stroke-current" strokeWidth="4" cx="50" cy="50" r="46" fill="transparent"></circle>
              <motion.circle
                initial={{ strokeDashoffset: dashArray }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                className="text-primary stroke-current"
                strokeWidth="4" strokeLinecap="round" cx="50" cy="50" r="46" fill="transparent"
                strokeDasharray={dashArray}
              ></motion.circle>
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[20px] font-semibold text-textPrimary">{confidencePercentage}%</span>
            </div>
          </div>
          <span className="text-[13px] font-medium text-textPrimary">{confidenceText}</span>
        </Card>
      </div>

      {/* Audio Controls (Spotify/Apple Music Style) */}
      <Card className="border border-border bg-card shadow-sm rounded-xl">
        <CardContent className="flex items-center justify-between p-4 px-6">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-textSecondary shrink-0">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-textPrimary">Audio Output</p>
              <p className="text-[12px] font-medium text-textSecondary">{selectedLanguage}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
             <Button 
              onClick={replayAudio} 
              size="icon" 
              variant="ghost"
              className="w-10 h-10 rounded-full shrink-0 text-textSecondary hover:text-textPrimary hover:bg-background transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button 
              onClick={toggleAudio} 
              size="icon" 
              className="w-12 h-12 rounded-full shrink-0 bg-textPrimary text-background hover:bg-textSecondary transition-colors shadow-sm"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </Button>
          </div>
          <audio ref={audioRef} src={audioUrl} className="hidden" />
        </CardContent>
      </Card>
    </motion.div>
  );
}
