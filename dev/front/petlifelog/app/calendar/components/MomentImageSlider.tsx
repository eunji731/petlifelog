'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getImagePath } from '@/app/common/lib/clientApi';

interface Photo {
  id: string;
  path: string;
}

interface MomentImageSliderProps {
  photos: Photo[];
  alt: string;
}

export default function MomentImageSlider({ photos, alt }: MomentImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) return null;

  if (photos.length === 1) {
    return (
      <div className="relative w-full h-full bg-surface-green/10">
        <Image
          src={getImagePath(photos[0].path)}
          alt={alt}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full h-full bg-surface-green/10 group/slider">
      <Image
        src={getImagePath(photos[currentIndex].path)}
        alt={`${alt} ${currentIndex + 1}`}
        fill
        className="object-cover transition-all duration-500"
      />
      
      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/30 hover:bg-black/50 text-white rounded-full opacity-0 group-hover/slider:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {photos.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === currentIndex ? 'bg-white scale-110' : 'bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Counter */}
      <div className="absolute top-4 right-4 px-2 py-1 bg-black/40 backdrop-blur-sm rounded-lg text-[9px] font-black text-white z-10">
        {currentIndex + 1} / {photos.length}
      </div>
    </div>
  );
}
