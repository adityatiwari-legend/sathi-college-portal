
import type { Metadata } from 'next';
import * as React from 'react';

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { UserDashboardSidebarContent } from '@/components/user-dashboard-sidebar-content';
import { DashboardMainContent } from '@/components/dashboard-main-content';

export const metadata: Metadata = {
  title: 'Sathi User Dashboard',
  description: 'Your Personal College Portal Dashboard',
};

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <UserDashboardSidebarContent />
      </Sidebar>
      <SidebarInset>
        <DashboardMainContent
          searchPlaceholder="Search your dashboard..."
          searchContext="user"
        >
          {children}
        </DashboardMainContent>
         <footer className="border-t bg-background p-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sathi College Portal - User. All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
