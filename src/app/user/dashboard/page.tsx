
"use client"; 

import * as React from "react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileText, UserCircle2, BookOpen, ListChecks, FolderArchive, ClipboardList } from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth"; 
import { auth } from "@/lib/firebase/config"; 
import { Skeleton } from "@/components/ui/skeleton"; 

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
    ? <Skeleton className="h-6 w-3/4" />
    : currentUser?.displayName 
      ? `Welcome back, ${currentUser.displayName}!`
      : "Welcome to your Sathi College Portal.";

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
        {isLoading ? (
          <Skeleton className="h-5 w-1/2" />
        ) : (
          <p className="text-muted-foreground">
            {welcomeMessage} Manage your documents and access college forms.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              My Profile
            </CardTitle>
            <UserCircle2 className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage your personal information and theme preferences.
            </p>
            <Link href="/user/dashboard/profile" className="text-sm font-medium text-primary hover:underline">
              View Profile &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Available Forms
            </CardTitle>
            <FileText className="h-6 w-6 text-accent" /> 
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Submit Admission, Course Registration, and other available forms.
            </p>
            <Link href="/user/dashboard/forms/admission" className="text-sm font-medium text-primary hover:underline mr-2">
              Admission Form &rarr;
            </Link>
            <Link href="/user/dashboard/forms/course-registration" className="text-sm font-medium text-primary hover:underline mr-2">
              Course Reg. &rarr;
            </Link>
             <Link href="/user/dashboard/forms/custom-form" className="text-sm font-medium text-primary hover:underline">
              Custom Form &rarr;
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              My Submitted Forms
            </CardTitle>
            <ListChecks className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track the status and details of your submitted forms.
            </p>
            <Link href="/user/dashboard/my-submitted-forms" className="text-sm font-medium text-primary hover:underline">
              View My Forms &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Shared Documents
            </CardTitle>
            <FolderArchive className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access documents and resources shared by the college administration.
            </p>
            <Link href="/user/dashboard/documents" className="text-sm font-medium text-primary hover:underline">
              View Documents &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Notifications & Alerts</CardTitle>
          <CardDescription>
            Stay updated with important announcements and deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No new notifications at this time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
