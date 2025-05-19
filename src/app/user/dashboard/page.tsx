
"use client"; 

import * as React from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  FileText, 
  UserCircle2, 
  BookOpen, 
  ListChecks, 
  FolderArchive, 
  ClipboardList, 
  CalendarDays,
  Bell,
  Settings,
  Edit3,
  Download
} from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth"; 
import { auth } from "@/lib/firebase/config"; 
import { Skeleton } from "@/components/ui/skeleton"; 
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Added this import

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  links?: { href: string; label: string; icon?: React.ReactNode }[];
  className?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, description, icon, href, links, className }) => (
  <Card className={cn("shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col", className)}>
    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
      <div className="space-y-1">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <CardDescription className="text-xs">{description}</CardDescription>
      </div>
      <div className="p-2 bg-primary/10 rounded-md text-primary">
        {icon}
      </div>
    </CardHeader>
    <CardContent className="flex-grow">
      {href && (
        <Button variant="link" asChild className="p-0 h-auto text-sm font-medium text-primary hover:underline">
          <Link href={href}>
            Explore {title} &rarr;
          </Link>
        </Button>
      )}
      {links && links.length > 0 && (
        <div className="mt-2 space-y-2">
          {links.map((link, index) => (
            <Button key={index} variant="ghost" size="sm" asChild className="w-full justify-start text-sm">
              <Link href={link.href}>
                {link.icon && <span className="mr-2 h-4 w-4">{link.icon}</span>}
                {link.label}
              </Link>
            </Button>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);


export default function UserDashboardPage() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const welcomeMessage = isLoading 
    ? <Skeleton className="h-8 w-3/4 mb-1" />
    : currentUser?.displayName 
      ? `Welcome back, ${currentUser.displayName}!`
      : "Welcome to your Sathi College Portal.";

  const subMessage = isLoading 
    ? <Skeleton className="h-5 w-1/2" />
    : "Here's an overview of your college activities and resources.";

  if (isLoading) {
    return (
      <div className="space-y-8 p-4 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="shadow-lg">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                  <Skeleton className="h-6 w-32 mb-1" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-10 w-10 rounded-md" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
         <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-7 w-1/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-5 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 sm:p-6">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{welcomeMessage}</h1>
        <p className="text-lg text-muted-foreground">
          {subMessage}
        </p>
      </div>

      {/* Key Actions / Overview Section */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mb-4">Quick Access</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="My Profile"
            description="View and update your personal information."
            icon={<UserCircle2 className="h-6 w-6" />}
            href="/user/dashboard/profile"
          />
          <DashboardCard
            title="College Forms"
            description="Access and submit available college forms."
            icon={<FileText className="h-6 w-6" />}
            links={[
              { href: "/user/dashboard/forms/admission", label: "Admission Form", icon: <UserCircle2 className="h-4 w-4"/> },
              { href: "/user/dashboard/forms/course-registration", label: "Course Registration", icon: <BookOpen className="h-4 w-4"/> },
              { href: "/user/dashboard/forms/custom-form", label: "Custom Inquiry", icon: <ClipboardList className="h-4 w-4"/> },
            ]}
          />
          <DashboardCard
            title="My Submitted Forms"
            description="Track your submitted forms and applications."
            icon={<ListChecks className="h-6 w-6" />}
            href="/user/dashboard/my-submitted-forms"
          />
        </div>
      </section>
      
      {/* Resources Section */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-4">Resources</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <DashboardCard
            title="Shared Documents"
            description="View documents shared by the administration."
            icon={<FolderArchive className="h-6 w-6" />}
            href="/user/dashboard/documents"
          />
          <DashboardCard
            title="College Timetable"
            description="Check the latest class schedules."
            icon={<CalendarDays className="h-6 w-6" />}
            href="/user/dashboard/view-timetable"
          />
        </div>
      </section>

      {/* Announcements Placeholder */}
      <section>
        <h2 className="text-2xl font-semibold tracking-tight mt-8 mb-4">Announcements</h2>
         <Card className="shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Latest Updates
            </CardTitle>
            <Bell className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No new announcements at this time. Check back later for updates.
            </p>
            {/* Example of what an announcement might look like */}
            {/* 
            <div className="mt-4 p-3 border rounded-md bg-primary/5 border-primary/20">
              <h3 className="font-semibold text-primary">Mid-term Exam Schedule Released!</h3>
              <p className="text-sm text-muted-foreground mt-1">The schedule for the upcoming mid-term examinations has been posted. Please check the 'View Timetable' section or 'Shared Documents' for details.</p>
              <p className="text-xs text-muted-foreground mt-2">Posted: {new Date().toLocaleDateString()}</p>
            </div>
            */}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

    
