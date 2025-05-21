
"use client"; 

import * as React from "react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FileText, UserCircle2, BookOpen, ListChecks, Download as DownloadIcon, Bell, CalendarDays, ClipboardList, Users } from "lucide-react"; // Added Users
import Link from "next/link";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth"; 
import { auth } from "@/lib/firebase/config"; 
import { Skeleton } from "@/components/ui/skeleton"; 
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  links?: { href: string; label: string; icon?: React.ReactNode }[];
  className?: string;
  children?: React.ReactNode; // Allow children for cards like Announcements
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, icon, href, links, className, children }) => (
  <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", className)}>
    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
      <div className="space-y-1">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <CardDescription className="text-xs leading-relaxed min-h-[30px]">{description}</CardDescription>
      </div>
      <div className="text-accent p-1 rounded-full bg-accent/10">
        {icon}
      </div>
    </CardHeader>
    <CardContent className="flex-grow">
      {children}
    </CardContent>
    <CardFooter className="pt-2">
      {href && (
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          Go to {title} &rarr;
        </Link>
      )}
      {links && links.length > 0 && (
        <div className="flex flex-col space-y-1 w-full">
          {links.map(link => (
            <Button key={link.href} variant="outline" size="sm" className="w-full justify-start" asChild>
              <Link href={link.href}>
                {link.icon && React.cloneElement(link.icon as React.ReactElement, { className: "mr-2 h-4 w-4" })}
                {link.label}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </CardFooter>
  </Card>
);


export default function UserDashboardPage() {
  const [currentUser, setCurrentUser] = React.useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const welcomeMessage = isLoading 
    ? <Skeleton className="h-6 w-3/4" />
    : currentUser?.displayName 
      ? `Welcome back, ${currentUser.displayName}!`
      : "Welcome to your Sathi College Portal.";

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
        {isLoading ? (
          <Skeleton className="h-5 w-1/2" />
        ) : (
          <p className="text-muted-foreground">
            {welcomeMessage} Manage your applications, documents, and profile.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="My Profile"
          description="View and manage your personal information and preferences."
          icon={<UserCircle2 className="h-6 w-6" />}
          href="/user/dashboard/profile"
        />
        
        <DashboardCard
          title="Submit Forms"
          description="Access and complete various college application forms."
          icon={<FileText className="h-6 w-6" />}
          links={[
            { href: "/user/dashboard/forms/admission", label: "Admission Form", icon: <Users /> },
            { href: "/user/dashboard/forms/course-registration", label: "Course Registration", icon: <BookOpen /> },
            { href: "/user/dashboard/forms/custom-form", label: "Custom Form", icon: <ClipboardList /> },
          ]}
        />
        
        <DashboardCard
          title="My Submitted Forms"
          description="Track the status and details of your submitted applications."
          icon={<ListChecks className="h-6 w-6" />}
          href="/user/dashboard/my-submitted-forms"
        />
        
        <DashboardCard
          title="Shared Documents"
          description="View documents shared by the college administration."
          icon={<DownloadIcon className="h-6 w-6" />}
          href="/user/dashboard/documents"
        />
        
        <DashboardCard
          title="View Timetable"
          description="Access the latest academic timetables and schedules."
          icon={<CalendarDays className="h-6 w-6" />}
          href="/user/dashboard/view-timetable"
        />

        <DashboardCard
          title="Notifications"
          description="Stay updated with important announcements and deadlines."
          icon={<Bell className="h-6 w-6" />}
          className="bg-muted/30 border-dashed" // Placeholder style
        >
           <CardContent>
             <p className="text-sm text-muted-foreground">No new notifications at this time.</p>
           </CardContent>
           <CardFooter className="pt-2">
             <span className="text-sm text-muted-foreground italic">Feature coming soon</span>
           </CardFooter>
        </DashboardCard>
      </div>
    </div>
  );
}
