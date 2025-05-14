
import type { Metadata } from 'next';
import * as React from 'react';

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { UserDashboardSidebarContent } from '@/components/user-dashboard-sidebar-content';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { VoiceSearchBar } from '@/components/ui/voice-search-bar';

export const metadata: Metadata = {
  title: 'Sathi User Dashboard',
  description: 'Your Personal College Portal Dashboard',
};

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const handleSearch = (query: string) => {
    console.log("User search query:", query);
    // Implement search logic here for user dashboard
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <UserDashboardSidebarContent />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex items-center">
            <SidebarTrigger className="mr-2 md:hidden" />
          </div>
          <div className="flex-grow px-2 sm:px-4 max-w-xl">
            <VoiceSearchBar 
              onSearchChange={handleSearch}
              placeholder="Search your dashboard..."
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
         <footer className="border-t bg-background p-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sathi College Portal - User. All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
