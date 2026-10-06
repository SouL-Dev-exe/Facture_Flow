'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { compressImageToWebP, CompressedImageResult } from '@/lib/image-compressor';

interface WebpUploaderProps {
  onImageCompressed: (dataUrl: string) => void;
  defaultImageUrl?: string | null;
}

export const WebpUploader: React.FC<WebpUploaderProps> = ({
  onImageCompressed,
  defaultImageUrl,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(defaultImageUrl || null);
  const [compressionStats, setCompressionStats] = useState<CompressedImageResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const result = await compressImageToWebP(file, {
        maxSizeKB: 180, // Target ceiling < 200 KB
        maxWidth: 1000,
        maxHeight: 1000,
      });

      setPreviewUrl(result.dataUrl);
      setCompressionStats(result);
      onImageCompressed(result.dataUrl);
    } catch (err) {
      console.error('Image compression failed', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-4 cursor-pointer transition flex flex-col items-center justify-center text-center group ${
          previewUrl
            ? 'border-indigo-500/50 bg-indigo-500/5'
            : 'border-zinc-300 dark:border-zinc-700 hover:border-indigo-500/60 dark:hover:border-indigo-500/60 bg-zinc-50 dark:bg-zinc-800/40'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp, image/jpg"
          className="hidden"
        />

        {previewUrl ? (
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Compressed Preview"
              className="w-24 h-24 object-cover rounded-lg shadow border border-zinc-200 dark:border-zinc-700 mb-2"
            />
            <span className="text-xs text-indigo-500 font-medium group-hover:underline">
              Click to replace image
            </span>
          </div>
        ) : (
          <div className="py-3 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2">
              <UploadCloud className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              Upload product photo
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
              Automatic client-side WebP compression (&lt; 200 KB)
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs rounded-xl flex items-center justify-center text-white text-xs font-medium">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            Compressing WebP...
          </div>
        )}
      </div>

      {compressionStats && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between text-emerald-400">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>WebP Compressed:</span>
          </div>
          <div className="font-mono">
            <span className="line-through text-zinc-500 text-[10px] mr-1.5">
              {compressionStats.originalSizeKB} KB
            </span>
            <strong className="text-emerald-300 font-bold">
              {compressionStats.sizeKB} KB
            </strong>
            <span className="text-[10px] ml-1 text-emerald-500">
              (-{Math.round((1 - compressionStats.sizeKB / compressionStats.originalSizeKB) * 100)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
