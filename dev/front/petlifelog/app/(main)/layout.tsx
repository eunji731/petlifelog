'use client';

import React, { useState } from 'react';
import Sidebar from '@/app/common/components/Sidebar';
import MobileHeader from '@/app/common/components/MobileHeader';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
