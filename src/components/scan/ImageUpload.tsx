'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';
import Image from 'next/image';
import type { ScanFormOcrData } from './scanFormSchema';

interface ImageUploadProps {
  onOcrComplete: (data: ScanFormOcrData) => void;
  onError: (error: string) => void;
}

export function ImageUpload({ onOcrComplete, onError }: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline } = useNetwork();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);

      if (isOnline) {
        await processImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        throw new Error('OCR failed');
      }

      const data = await response.json();
      onOcrComplete(data);
    } catch (error) {
      onError('Failed to process image. Please enter details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="card-elevated bg-card border-border">
      <CardContent className="p-6">
        {!isOnline && (
          <div className="mb-4 rounded-lg bg-pending-muted border border-pending/20 p-4">
            <p className="text-sm font-semibold text-foreground mb-1">OCR unavailable offline</p>
            <p className="text-sm text-muted-foreground">
              Please enter referral details manually below.
            </p>
          </div>
        )}

        {!image ? (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isOnline}
                className="font-medium"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*';
                    fileInputRef.current.capture = 'environment';
                    fileInputRef.current.click();
                  }
                }}
                disabled={!isOnline}
                className="font-medium"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground/90 text-center leading-relaxed">
              {isOnline
                ? 'Upload or photograph a referral form to auto-fill details'
                : 'Connect to network to enable OCR scanning'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-surface-sunken">
              <Image
                src={image}
                alt="Uploaded referral form"
                className="max-h-64 w-full object-contain"
                width={100}
                height={100}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2 shadow-lg"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">Processing image with AI...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
