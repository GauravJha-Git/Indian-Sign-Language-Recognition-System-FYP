import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, ArrowRight } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';

interface PredictionResultProps {
  originalPrediction: string;
  translatedText: string;
  selectedLanguage: string;
  confidence: number;
  audioUrl: string;
}

export function PredictionResult({ originalPrediction, translatedText, selectedLanguage, confidence, audioUrl }: PredictionResultProps) {
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

  const confidencePercentage = (confidence * 100).toFixed(1);
  const dashArray = 283;
  const dashOffset = dashArray - (dashArray * confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="space-y-6 mt-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prediction & Translation Card */}
        <Card className="md:col-span-2 overflow-hidden border-primary/20 relative group flex flex-col">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
          
          {/* Original Prediction */}
          <CardContent className="p-8 flex-1 flex flex-col justify-center relative z-10 border-b border-border/50">
            <p className="text-sm font-medium text-textSecondary mb-2 uppercase tracking-wider">Original English Prediction</p>
            <h3 className="text-2xl sm:text-3xl font-medium text-textSecondary/80">
              "{originalPrediction}"
            </h3>
          </CardContent>

          {/* Translated Text */}
          <CardContent className="p-8 flex-1 flex flex-col justify-center relative z-10 bg-primary/5">
            <div className="flex items-center space-x-2 mb-2">
              <ArrowRight className="w-4 h-4 text-primaryAccent" />
              <p className="text-sm font-medium text-primaryAccent uppercase tracking-wider">
                Translated Text ({selectedLanguage})
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-textPrimary leading-tight">
              "{translatedText}"
            </h2>
          </CardContent>
        </Card>

        {/* Confidence Card */}
        <Card className="flex flex-col items-center justify-center p-6 bg-secondary/50">
          <p className="text-sm font-medium text-textSecondary mb-4">AI Confidence</p>
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                className="text-border stroke-current"
                strokeWidth="8"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
              ></circle>
              <motion.circle
                initial={{ strokeDashoffset: dashArray }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                className="text-primary stroke-current"
                strokeWidth="8"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                strokeDasharray={dashArray}
              ></motion.circle>
            </svg>
            <div className="absolute flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-textPrimary">{confidencePercentage}%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Audio Controls */}
      <Card className="bg-card">
        <CardContent className="flex items-center justify-between p-4 sm:p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Volume2 className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-textPrimary">Audio Output ({selectedLanguage})</p>
              <p className="text-sm text-textSecondary">Listen to the translated sign</p>
            </div>
          </div>
          <Button 
            onClick={toggleAudio} 
            size="icon" 
            className="w-12 h-12 rounded-full shadow-lg shadow-primary/25 transition-transform hover:scale-105"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          </Button>
          <audio ref={audioRef} src={audioUrl} className="hidden" />
        </CardContent>
      </Card>
    </motion.div>
  );
}
