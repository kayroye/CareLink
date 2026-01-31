'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';
import Image from 'next/image';

interface ImageUploadProps {
  onOcrComplete: (data: { name: string; diagnosis: string; facility: string }) => void;
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
    <Card>
      <CardContent className="p-4">
        {!isOnline && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-amber-800">
            <p className="text-sm font-medium">OCR unavailable offline</p>
            <p className="text-sm">Please enter referral details manually below.</p>
          </div>
        )}

        {!image ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isOnline}
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
            <p className="text-sm text-gray-500">
              {isOnline
                ? 'Upload or photograph a referral form to auto-fill details'
                : 'Connect to network to enable OCR scanning'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Image
                src={image}
                alt="Uploaded referral form"
                className="max-h-64 w-full rounded-lg object-contain"
                width={100}
                height={100}
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing image with AI...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
