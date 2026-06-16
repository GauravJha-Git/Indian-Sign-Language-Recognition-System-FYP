import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileVideo, X } from 'lucide-react';
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

  if (selectedFile) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-6 mt-4 border-2 border-border rounded-2xl bg-secondary flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-card rounded-xl">
            <FileVideo className="w-8 h-8 text-primaryAccent" />
          </div>
          <div>
            <p className="font-medium text-textPrimary truncate max-w-[200px] sm:max-w-xs">{selectedFile.name}</p>
            <p className="text-sm text-textSecondary">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClear} className="text-textSecondary hover:text-error">
          <X className="w-5 h-5" />
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={cn(
        "relative flex flex-col items-center justify-center w-full h-64 mt-4 border-2 border-dashed rounded-2xl cursor-pointer transition-colors duration-200 ease-in-out",
        isDragActive ? "border-primary bg-primary/5" : "border-border bg-secondary hover:bg-secondary/80 hover:border-border/80"
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
        <div className="p-4 mb-4 rounded-full bg-card shadow-sm border border-border">
          <UploadCloud className="w-8 h-8 text-primary" />
        </div>
        <p className="mb-2 text-sm text-textSecondary">
          <span className="font-semibold text-textPrimary">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-textSecondary/70">MP4, AVI, MOV (Max. 50MB)</p>
      </div>
    </motion.div>
  );
}
