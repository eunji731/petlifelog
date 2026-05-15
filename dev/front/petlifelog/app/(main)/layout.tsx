'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/app/common/components/Sidebar';
import MobileHeader from '@/app/common/components/MobileHeader';
import { usePet } from '@/app/common/hooks/usePet';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { fetchPets } = usePet();

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
