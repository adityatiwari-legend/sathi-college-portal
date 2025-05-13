
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Users, Settings } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Sathi College Portal. Manage forms and settings efficiently.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              College Forms
            </CardTitle>
            <FileText className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access and manage various college-related forms like admission, course registration, etc.
            </p>
            <Link href="/dashboard/forms/admission" className="text-sm font-medium text-primary hover:underline">
              Go to Forms &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              User Management
            </CardTitle>
            <Users className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Administer user accounts, roles, and permissions within the portal. (Placeholder)
            </p>
             <Link href="#" className="text-sm font-medium text-primary hover:underline text-muted-foreground/50 cursor-not-allowed" aria-disabled="true" tabIndex={-1}>
              Manage Users &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              System Settings
            </CardTitle>
            <Settings className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure application settings, themes, and integrations.
            </p>
            <Link href="/dashboard/settings" className="text-sm font-medium text-primary hover:underline">
              Configure Settings &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Forms Overview</CardTitle>
          <CardDescription>
            This area will display a summary or quick access to different forms once they are implemented.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Currently, no forms are configured. Please check back later or navigate using the sidebar.
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg bg-card/50">
              <h3 className="font-semibold mb-2">Admission Forms</h3>
              <p className="text-sm text-muted-foreground">Create, view, and manage student admission applications.</p>
              <Link href="/dashboard/forms/admission" className="text-sm mt-2 inline-block font-medium text-primary hover:underline">
                View Admission Forms &rarr;
              </Link>
            </div>
            <div className="p-4 border rounded-lg bg-card/50">
              <h3 className="font-semibold mb-2">Course Registration</h3>
              <p className="text-sm text-muted-foreground">Handle student course selections and registrations for academic terms.</p>
               <Link href="/dashboard/forms/course-registration" className="text-sm mt-2 inline-block font-medium text-primary hover:underline">
                View Course Registrations &rarr;
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
