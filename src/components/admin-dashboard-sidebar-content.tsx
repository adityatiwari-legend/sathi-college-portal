
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Building2,
  Users,
  BookOpen,
  UploadCloud,
  Archive,
  PlusCircle, // Still can be used for the custom form
} from "lucide-react";

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
  subItems?: NavItemProps[];
}

const NavItem = ({ href, icon, label, tooltip, subItems }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || 
                   (href !== '/admin/dashboard' && pathname.startsWith(href)) || 
                   (subItems && subItems.some(sub => pathname.startsWith(sub.href)));


  if (subItems && subItems.length > 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={tooltip}
          isActive={isActive}
        >
          {icon}
          <span>{label}</span>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {subItems.map((item) => (
             <SidebarMenuSubItem key={item.href}>
               <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuSubButton isActive={pathname === item.href || pathname.startsWith(item.href)}>
                  {item.icon}
                  <span>{item.label}</span>
                </SidebarMenuSubButton>
              </Link>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
       <Link href={href} passHref legacyBehavior>
        <SidebarMenuButton tooltip={tooltip} isActive={isActive}>
          {icon}
          <span>{label}</span>
        </SidebarMenuButton>
      </Link>
    </SidebarMenuItem>
  );
};


const navItems: NavItemProps[] = [
  { href: "/admin/dashboard", icon: <LayoutDashboard />, label: "Dashboard", tooltip: "Admin Dashboard Home" },
  {
    href: "/admin/dashboard/forms", 
    icon: <FileText />,
    label: "Manage Forms", 
    tooltip: "Manage College Forms",
    subItems: [
      { href: "/admin/dashboard/forms/admission", icon: <Users />, label: "Admission Config", tooltip: "Configure Admission Forms" },
      { href: "/admin/dashboard/forms/course-registration", icon: <BookOpen />, label: "Course Reg. Config", tooltip: "Configure Course Registration Forms" },
      { href: "/admin/dashboard/forms/configure-custom", icon: <PlusCircle />, label: "Configure Custom Form", tooltip: "Configure the Global Custom Form" },
    ],
  },
  { href: "/admin/dashboard/all-submitted-forms", icon: <Archive />, label: "All Submissions", tooltip: "View All Submitted Forms" },
  { href: "/admin/dashboard/upload-document", icon: <UploadCloud />, label: "Upload Document", tooltip: "Manage Uploaded Documents" },
  { href: "/admin/dashboard/settings", icon: <Settings />, label: "Settings", tooltip: "App Settings" },
];

export function AdminDashboardSidebarContent() { 
  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight text-primary">
            Sathi Admin
          </h2>
        </Link>
      </SidebarHeader>
      <SidebarContent className="flex-grow">
        <SidebarMenu>
          {navItems.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://picsum.photos/id/237/200/200" alt="Admin Avatar" data-ai-hint="admin avatar"/>
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">
              Admin User
            </span>
            <span className="text-xs text-sidebar-foreground/70">
              Administrator
            </span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground" asChild>
            <Link href="/login">
              <LogOut className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}
