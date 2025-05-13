
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CourseRegistrationFormsPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dashboard"> {/* Updated back link */}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Course Registration</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage Course Registrations</CardTitle>
          <CardDescription>
            This section will allow you to manage student course registration processes.
            Content for course registration forms will be added here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Placeholder content for course registration. Future functionality will include:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Setting up course registration periods.</li>
            <li>Viewing registered students per course.</li>
            <li>Managing course capacities and waitlists.</li>
            <li>Generating registration reports.</li>
          </ul>
          <div className="mt-6">
            <Button>Open New Registration Cycle (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
