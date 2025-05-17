
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Users, Settings, Archive, BookOpen } from "lucide-react"; // Added BookOpen
import Link from "next/link";

export default function AdminDashboardPage() { 
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Sathi College Portal Admin Panel. Manage forms and settings efficiently.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Manage College Forms
            </CardTitle>
            <FileText className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure admission, course registration, and other form types.
            </p>
            <Link href="/admin/dashboard/forms" className="text-sm font-medium text-primary hover:underline">
              Manage Forms &rarr;
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              All Submitted Forms
            </CardTitle>
            <Archive className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage all forms submitted by users across the portal.
            </p>
            <Link href="/admin/dashboard/all-submitted-forms" className="text-sm font-medium text-primary hover:underline">
              View All Submissions &rarr;
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
            <Link href="/admin/dashboard/settings" className="text-sm font-medium text-primary hover:underline">
              Configure Settings &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Quick Access</CardTitle>
          <CardDescription>
            Jump to key administrative sections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg bg-card/50">
              <h3 className="font-semibold mb-2">Configure Admission Forms</h3>
              <p className="text-sm text-muted-foreground">Set title, description, and status for admissions.</p>
              <Link href="/admin/dashboard/forms/admission" className="text-sm mt-2 inline-block font-medium text-primary hover:underline">
                Configure Admissions &rarr;
              </Link>
            </div>
            <div className="p-4 border rounded-lg bg-card/50">
              <h3 className="font-semibold mb-2">Configure Course Reg.</h3>
              <p className="text-sm text-muted-foreground">Set up course registration periods and settings.</p>
               <Link href="/admin/dashboard/forms/course-registration" className="text-sm mt-2 inline-block font-medium text-primary hover:underline">
                Configure Course Reg. &rarr;
              </Link>
            </div>
            <div className="p-4 border rounded-lg bg-card/50">
              <h3 className="font-semibold mb-2">View All Submissions</h3>
              <p className="text-sm text-muted-foreground">Review all submitted forms.</p>
               <Link href="/admin/dashboard/all-submitted-forms" className="text-sm mt-2 inline-block font-medium text-primary hover:underline">
                Go to Submissions &rarr;
              </Link>
            </div>
             <div className="p-4 border rounded-lg bg-card/50">
              <h3 className="font-semibold mb-2">Upload Documents</h3>
              <p className="text-sm text-muted-foreground">Manage documents shared with users.</p>
               <Link href="/admin/dashboard/upload-document" className="text-sm mt-2 inline-block font-medium text-primary hover:underline">
                Manage Uploads &rarr;
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
