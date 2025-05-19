
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
  BookOpen,
  ListChecks, 
  ClipboardList,
  FolderArchive,
  Users, // Keep for Admission Form icon in sub-menu
  CalendarDays, // Changed from Clock for Timetable for better semantics
  Settings // Added if profile link is considered a setting
} from "lucide-react";

import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import * as React from "react";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  tooltip: string;
  disabled?: boolean;
  subItems?: NavItemProps[];
}

const NavItem = ({ href, icon, label, tooltip, disabled = false, subItems }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = !disabled && (
    pathname === href || 
    (href !== '/user/dashboard' && pathname.startsWith(href)) ||
    (subItems && subItems.some(sub => pathname.startsWith(sub.href)))
  );

  if (subItems && subItems.length > 0) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={tooltip}
          isActive={isActive}
          disabled={disabled}
          className={disabled ? "cursor-not-allowed opacity-60" : ""}
        >
          {icon}
          <span>{label}</span>
        </SidebarMenuButton>
        <SidebarMenuSub>
          {subItems.map((item) => (
             <SidebarMenuSubItem key={item.href}>
               <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuSubButton 
                  isActive={pathname === item.href || pathname.startsWith(item.href)}
                  disabled={item.disabled}
                  className={item.disabled ? "cursor-not-allowed opacity-60" : ""}
                >
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
  { href: "/user/dashboard", icon: <LayoutDashboard />, label: "Dashboard", tooltip: "User Dashboard Home" },
  { href: "/user/dashboard/profile", icon: <UserCircle2 />, label: "My Profile", tooltip: "View & Edit Your Profile" }, 
  {
    href: "/user/dashboard/forms", 
    icon: <FileText />,
    label: "College Forms", 
    tooltip: "Access College Forms",
    subItems: [
      { href: "/user/dashboard/forms/admission", icon: <Users />, label: "Admission", tooltip: "Admission Form" },
      { href: "/user/dashboard/forms/course-registration", icon: <BookOpen />, label: "Course Reg.", tooltip: "Course Registration Form" },
      { href: "/user/dashboard/forms/custom-form", icon: <ClipboardList />, label: "Custom Inquiry", tooltip: "Fill Custom Form" },
    ],
  },
  { href: "/user/dashboard/my-submitted-forms", icon: <ListChecks />, label: "My Submitted Forms", tooltip: "Track Your Form Submissions" },
  { href: "/user/dashboard/documents", icon: <FolderArchive />, label: "Shared Documents", tooltip: "View Admin-Shared Documents" },
  { href: "/user/dashboard/view-timetable", icon: <CalendarDays />, label: "View Timetable", tooltip: "View College Timetables" },
];

export function UserDashboardSidebarContent() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const userName = currentUser?.displayName || "User";
  const userEmail = currentUser?.email || "user@example.com";
  const userAvatar = currentUser?.photoURL || "https://placehold.co/200x200.png"; 
  
  const getAvatarFallback = (name?: string | null): string => {
    const processedName = name?.trim();
    if (!processedName) return "U";

    const parts = processedName.split(" ").filter(part => part.length > 0);

    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length === 1) {
      return parts[0][0].toUpperCase();
    }
    return "U";
  };
  const avatarFallback = getAvatarFallback(userName);

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
            <AvatarImage src={userAvatar} alt="User Avatar" data-ai-hint="user avatar" />
            <AvatarFallback>{avatarFallback}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium text-sidebar-foreground truncate" title={userName}>
              {userName}
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate" title={userEmail}>
              {userEmail}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto text-sidebar-foreground/70 hover:text-sidebar-foreground" asChild>
            <Link href="/login"> {/* Should ideally be a logout button if user is logged in */}
              <LogOut className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </SidebarFooter>
    </>
  );
}

    