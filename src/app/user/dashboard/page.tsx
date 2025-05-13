
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, UploadCloud, UserCircle2 } from "lucide-react";
import Link from "next/link";

export default function UserDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your Sathi College Portal. Manage your documents and view form statuses.
        </p>
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
              View and manage your personal information. (Coming Soon)
            </p>
            <Link href="#" className="text-sm font-medium text-primary hover:underline text-muted-foreground/50 cursor-not-allowed" aria-disabled="true" tabIndex={-1}>
              View Profile &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              My Submitted Forms
            </CardTitle>
            <FileText className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track the status of your admission, course registration, and other submitted forms. (Coming Soon)
            </p>
             <Link href="#" className="text-sm font-medium text-primary hover:underline text-muted-foreground/50 cursor-not-allowed" aria-disabled="true" tabIndex={-1}>
              View My Forms &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Upload Documents
            </CardTitle>
            <UploadCloud className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload necessary documents for your applications or records.
            </p>
            <Link href="/user/dashboard/upload-document" className="text-sm font-medium text-primary hover:underline">
              Upload Now &rarr;
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
