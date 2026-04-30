'use client';

import React from 'react';

export default function ActivityHeatmap() {
  const weeks = 5;
  const days = 7;
  const data = Array.from({ length: weeks * days }, () => Math.floor(Math.random() * 5));

  const getColor = (value: number) => {
    switch (value) {
      case 0: return 'bg-white/50';
      case 1: return 'bg-light-green';
      case 2: return 'bg-main-green/50';
      case 3: return 'bg-main-green';
      case 4: return 'bg-deep-green';
      default: return 'bg-white/50';
    }
  };

  return (
    <div className="mt-auto px-12 py-6">
      <div className="flex items-center gap-4">
        <h3 className="text-[10px] font-black text-text-sub/60 tracking-widest uppercase">
          Activity Density
        </h3>
        <div className="flex gap-1">
          {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} className="flex flex-col gap-1">
              {Array.from({ length: days }).map((_, d) => (
                <div 
                  key={d} 
                  className={`w-2 h-2 rounded-[1px] ${getColor(data[w * days + d])}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
