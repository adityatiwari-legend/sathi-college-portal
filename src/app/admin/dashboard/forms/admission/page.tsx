
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AdmissionFormsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dashboard"> {/* Updated back link */}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Admission Forms</h1>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Admission Applications</CardTitle>
          <CardDescription>
            This section will allow you to create, view, and manage student admission forms.
            Content for admission forms will be added here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Placeholder content for admission forms. Future functionality will include:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Creating new admission form templates.</li>
            <li>Viewing submitted applications.</li>
            <li>Filtering and sorting applications.</li>
            <li>Managing application statuses (e.g., pending, approved, rejected).</li>
          </ul>
           <div className="mt-6">
            <Button>Create New Admission Form (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
