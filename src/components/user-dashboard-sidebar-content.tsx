
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
  UploadCloud,
} from "lucide-react";

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  // SidebarMenuSub, // Not used for now, can be added if submenus are needed
  // SidebarMenuSubItem,
  // SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
// import { cn } from "@/lib/utils"; // cn might not be needed here

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
  // subItems?: NavItemProps[]; // SubItems can be added later if needed
}

const NavItem = ({ href, icon, label, tooltip }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/user/dashboard' && pathname.startsWith(href));

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
  { href: "/user/dashboard/upload-document", icon: <UploadCloud />, label: "Upload Document", tooltip: "Upload Your Documents" },
  { href: "/user/dashboard/my-profile", icon: <UserCircle2 />, label: "My Profile", tooltip: "View Your Profile (Coming Soon)" }, // Placeholder
  { href: "/user/dashboard/my-forms", icon: <FileText />, label: "My Forms", tooltip: "View Your Submitted Forms (Coming Soon)" }, // Placeholder
];

export function UserDashboardSidebarContent() {
  // Example user data, in a real app this would come from auth context or state
  const userName = auth.currentUser?.displayName || auth.currentUser?.email || "User";
  const userEmail = auth.currentUser?.email || "user@example.com";
  const userAvatar = auth.currentUser?.photoURL || "https://picsum.photos/id/338/200/200"; // Different avatar for user
  const avatarFallback = userName.substring(0, 2).toUpperCase();


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
          {navItems.map((item) => {
            // Disable placeholder links for now
            const isComingSoon = item.href.includes("my-profile") || item.href.includes("my-forms");
            if (isComingSoon) {
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton tooltip={item.tooltip} isActive={false} disabled className="cursor-not-allowed opacity-60">
                    {item.icon}
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }
            return <NavItem key={item.href} {...item} />;
          })}
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

// Need to import auth to get current user details for sidebar footer
import { auth } from "@/lib/firebase/config";
