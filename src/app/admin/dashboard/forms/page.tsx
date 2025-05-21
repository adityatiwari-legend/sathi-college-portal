
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Edit3, Settings, ListChecks, LayoutList, PlusCircle, Construction } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ManageFormsPage() {
  
  const handleCreateNewFormType = () => {
    toast({
      title: "Feature Coming Soon!",
      description: "The ability to dynamically create entirely new form types with custom fields is under development.",
      variant: "default",
      duration: 5000,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Manage Form Types</h1>
      </div>
      
      <CardDescription>
        Configure settings for standard forms or create new custom form templates.
      </CardDescription>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Admission Form Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Set the title, description, and active status for the standard Admission Form.
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/dashboard/forms/admission">
                <Edit3 className="mr-2 h-4 w-4" /> Configure Admission Form
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Course Registration Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Set the title, description, and active status for Course Registration.
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/dashboard/forms/course-registration">
                <Edit3 className="mr-2 h-4 w-4" /> Configure Course Reg.
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutList className="h-5 w-5 text-primary" />
              Manage Global Custom Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Define the fields, title, description, and status for the global custom form.
            </p>
            <Button asChild variant="outline">
              <Link href="/admin/dashboard/forms/configure-custom">
                <Edit3 className="mr-2 h-4 w-4" /> Configure Global Custom Form
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow bg-muted/30 border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-accent" />
              Advanced Form Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Create multiple, fully custom form templates with various field types and validation.
            </p>
            <Button variant="secondary" onClick={handleCreateNewFormType}>
              <Construction className="mr-2 h-4 w-4" />
              Coming Soon
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
