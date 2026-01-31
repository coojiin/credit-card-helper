'use client';

import { Navigation } from '@/components/Navigation';
import { useEffect } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Attempt to request persistent storage
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then(persistent => {
        if (persistent) {
          console.log("Storage will not be cleared except by explicit user action");
        } else {
          console.log("Storage may be cleared under storage pressure.");
        }
      });
    }
  }, []);

  return (
    <>
      {children}
      <Navigation />
    </>
  );
}

