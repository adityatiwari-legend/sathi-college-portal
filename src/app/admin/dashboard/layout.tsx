
import type { Metadata } from 'next';
import * as React from 'react';

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AdminDashboardSidebarContent } from '@/components/admin-dashboard-sidebar-content'; // Updated import
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sathi Admin Dashboard',
  description: 'College Forms Management Admin Dashboard',
};

export default function AdminDashboardLayout({ // Renamed component
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <AdminDashboardSidebarContent />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
          <div className="flex items-center">
            <SidebarTrigger className="mr-2 md:hidden" />
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
          &copy; {new Date().getFullYear()} Sathi College Portal - Admin. All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
