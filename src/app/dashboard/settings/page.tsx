
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>
            Configure various aspects of the Sathi College Portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            This area will contain options to customize the application behavior, appearance, and integrations.
          </p>
          
          <div>
            <h3 className="font-semibold mb-2">General Settings</h3>
            <p className="text-sm text-muted-foreground">Portal name, academic year, etc.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Theme Customization</h3>
            <p className="text-sm text-muted-foreground">Colors, logo, and layout options.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Notification Settings</h3>
            <p className="text-sm text-muted-foreground">Email templates and notification preferences.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Integrations</h3>
            <p className="text-sm text-muted-foreground">Connect with other services (e.g., payment gateways, SIS).</p>
          </div>

          <div className="mt-6">
            <Button variant="secondary" disabled>Save Changes (Coming Soon)</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
