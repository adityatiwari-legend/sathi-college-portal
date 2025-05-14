
"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  UserCircle2,
  LogOut,
  Building2,
  Files, // Changed UploadCloud to Files
} from "lucide-react";

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
  disabled?: boolean;
}

const NavItem = ({ href, icon, label, tooltip, disabled = false }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = !disabled && (pathname === href || (href !== '/user/dashboard' && pathname.startsWith(href)));

  if (disabled) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton tooltip={tooltip} isActive={false} disabled className="cursor-not-allowed opacity-60">
          {icon}
          <span>{label}</span>
        </SidebarMenuButton>
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
  { href: "/user/dashboard", icon: <LayoutDashboard />, label: "Dashboard", tooltip: "User Dashboard" },
  { href: "/user/dashboard/documents", icon: <Files />, label: "Shared Documents", tooltip: "View Shared Documents" },
  { href: "/user/dashboard/my-profile", icon: <UserCircle2 />, label: "My Profile", tooltip: "View Your Profile (Coming Soon)", disabled: true }, 
  { href: "/user/dashboard/my-forms", icon: <FileText />, label: "My Forms", tooltip: "View Your Submitted Forms (Coming Soon)", disabled: true }, 
];

export function UserDashboardSidebarContent() {
  // Placeholder user data
  const userName = "User";
  const userEmail = "user@example.com";
  const userAvatar = "https://picsum.photos/id/338/200/200"; 
  const avatarFallback = "US";


  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/user/dashboard" className="flex items-center gap-2">
          <Building2 className="h-8 w-8 text-primary" />
          <h2 className="text-xl font-semibold tracking-tight text-primary">
            Sathi Portal
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
            <AvatarImage src={userAvatar} alt="User Avatar" data-ai-hint="person avatar" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {userName}
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate">
              {userEmail}
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
