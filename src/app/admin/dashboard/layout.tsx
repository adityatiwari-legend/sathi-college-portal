
import type { Metadata } from 'next';
import * as React from 'react';

import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AdminDashboardSidebarContent } from '@/components/admin-dashboard-sidebar-content';
import { DashboardMainContent } from '@/components/dashboard-main-content';


export const metadata: Metadata = {
  title: 'Sathi Admin Dashboard',
  description: 'College Forms Management Admin Dashboard',
};

export default function AdminDashboardLayout({
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
        <DashboardMainContent
          searchPlaceholder="Search admin dashboard..."
          searchContext="admin"
        >
          {children}
        </DashboardMainContent>
         <footer className="border-t bg-background p-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Sathi College Portal - Admin. All rights reserved.
        </footer>
      </SidebarInset>
    </SidebarProvider>
  );
}
