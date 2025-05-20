
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Save, Loader2, Settings2, AlertTriangle, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription as ShadFormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const settingsFormSchema = z.object({
  portalName: z.string().min(3, "Portal name must be at least 3 characters").max(100),
  contactEmail: z.string().email("Please enter a valid contact email address."),
  allowNewUserSignups: z.boolean().default(true),
  maintenanceMode: z.boolean().default(false),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const DEFAULT_SETTINGS: SettingsFormValues = {
  portalName: "Sathi College Portal",
  contactEmail: "contact@sathi.edu",
  allowNewUserSignups: true,
  maintenanceMode: false,
};

export default function SettingsPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: DEFAULT_SETTINGS,
  });

  const fetchSettings = React.useCallback(async () => {
    setIsLoadingSettings(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const response = await fetch("/api/settings");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to load application settings.");
      }
      const data = await response.json();
      if (data.settings && Object.keys(data.settings).length > 0) {
        form.reset({
          portalName: data.settings.portalName || DEFAULT_SETTINGS.portalName,
          contactEmail: data.settings.contactEmail || DEFAULT_SETTINGS.contactEmail,
          allowNewUserSignups: data.settings.allowNewUserSignups === undefined ? DEFAULT_SETTINGS.allowNewUserSignups : data.settings.allowNewUserSignups,
          maintenanceMode: data.settings.maintenanceMode === undefined ? DEFAULT_SETTINGS.maintenanceMode : data.settings.maintenanceMode,
        });
      } else {
        form.reset(DEFAULT_SETTINGS); // Reset to defaults if no settings found
      }
    } catch (err: any) {
      setSubmitError(err.message);
      toast({ title: "Error Loading Settings", description: err.message, variant: "destructive" });
      form.reset(DEFAULT_SETTINGS); // Reset to defaults on error
    } finally {
      setIsLoadingSettings(false);
    }
  }, [form]);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function onSubmit(data: SettingsFormValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      // TODO: In a real app, ensure the user making this request is an authenticated admin
      // For now, we'll proceed without explicit admin auth on this endpoint for demo purposes.
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save application settings.");
      }
      toast({ title: "Settings Saved", description: "Application settings have been updated." });
      setSubmitSuccess("Application settings saved successfully!");
    } catch (err: any) {
      setSubmitError(err.message);
      toast({ title: "Error Saving Settings", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Application Settings</h1>
        </div>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-6 w-6 text-primary" />
                General Configuration
              </CardTitle>
              <CardDescription>
                Manage global settings for the Sathi College Portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {isLoadingSettings ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <div className="flex items-center space-x-2"><Skeleton className="h-6 w-10" /><Skeleton className="h-4 w-32" /></div>
                  <div className="flex items-center space-x-2"><Skeleton className="h-6 w-10" /><Skeleton className="h-4 w-32" /></div>
                </>
              ) : (
                <>
                  {submitSuccess && (
                    <div className="p-3 border rounded-md bg-green-50 border-green-200 text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      <p className="text-sm">{submitSuccess}</p>
                    </div>
                  )}
                  {submitError && (
                    <div className="p-3 border rounded-md bg-red-50 border-red-200 text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      <p className="text-sm">{submitError}</p>
                    </div>
                  )}

                  <FormField
                    control={form.control}
                    name="portalName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portal Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Sathi University Portal" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <ShadFormDescription>The name displayed throughout the portal.</ShadFormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Contact Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="e.g., info@sathicollege.edu" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <ShadFormDescription>The main email address for general inquiries.</ShadFormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="allowNewUserSignups"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Allow New User Signups</FormLabel>
                          <ShadFormDescription>
                            Enable or disable the ability for new users to create accounts.
                          </ShadFormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                            aria-label="Allow new user signups"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Maintenance Mode</FormLabel>
                          <ShadFormDescription>
                            Put the portal into maintenance mode. (Further implementation needed to enforce this across user pages).
                          </ShadFormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
                            aria-label="Enable maintenance mode"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isSubmitting || isLoadingSettings}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Settings
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
