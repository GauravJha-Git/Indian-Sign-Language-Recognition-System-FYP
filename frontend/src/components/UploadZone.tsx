import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Video, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export function UploadZone({ onFileSelect, selectedFile, onClear }: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = React.useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes('video')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [duration, setDuration] = React.useState<number>(0);

  React.useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setVideoUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setVideoUrl(null);
    }
  }, [selectedFile]);

  if (selectedFile && videoUrl) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mt-2 border border-border rounded-xl bg-surface overflow-hidden shadow-sm"
      >
        <div className="w-full h-48 bg-background flex items-center justify-center relative group">
          <video 
            src={videoUrl} 
            controls 
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            className="w-full h-full object-contain"
            controlsList="nodownload"
          />
        </div>
        <div className="p-3 flex items-center justify-between border-t border-border">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="p-2 bg-surface border border-border rounded-lg shrink-0">
              <Video className="w-4 h-4 text-textSecondary" />
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-textPrimary truncate text-[13px]">{selectedFile.name}</p>
              <div className="flex items-center space-x-2 text-[11px] font-medium text-textSecondary/70 mt-0.5">
                <span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                <span>•</span>
                <span>{duration > 0 ? `${Math.round(duration)} sec` : '...'}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClear} className="w-8 h-8 text-textSecondary hover:text-textPrimary shrink-0 transition-colors">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-56 mt-2 border border-dashed rounded-xl cursor-pointer transition-colors duration-200 ease-in-out bg-surface",
        isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-textSecondary/50"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input 
        type="file" 
        accept="video/mp4,video/x-m4v,video/avi,video/quicktime" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={handleChange}
      />
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <div className="p-3 mb-4 rounded-lg bg-background border border-border">
          <Upload className="w-5 h-5 text-textSecondary" />
        </div>
        <p className="mb-1 text-[13px] font-medium text-textPrimary">
          Click to upload <span className="text-textSecondary font-normal">or drag and drop</span>
        </p>
        <p className="text-[11px] font-medium text-textSecondary/70 uppercase tracking-wider">MP4, AVI, MOV (Max. 50MB)</p>
      </div>
    </motion.div>
  );
}
