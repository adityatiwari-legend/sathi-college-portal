"use client";

import * as React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { VoiceSearchBar } from '@/components/ui/voice-search-bar';

interface DashboardMainContentProps {
  children: React.ReactNode;
  searchPlaceholder: string;
  searchContext: 'admin' | 'user';
}

export function DashboardMainContent({
  children,
  searchPlaceholder,
  searchContext,
}: DashboardMainContentProps) {
  const handleSearch = (query: string) => {
    console.log(`${searchContext} search query:`, query);
    // Implement search logic here for the specific dashboard
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
        <div className="flex items-center">
          <SidebarTrigger className="mr-2 md:hidden" />
        </div>
        <div className="flex-grow px-2 sm:px-4 max-w-xl">
          <VoiceSearchBar
            onSearchChange={handleSearch}
            placeholder={searchPlaceholder}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <Home className="h-5 w-5" />
              <span className="sr-only">Go to Homepage</span>
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6">{children}</main>
    </>
  );
}
