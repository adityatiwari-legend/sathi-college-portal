
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Save, Loader2, Settings, AlertTriangle, CheckCircle } from "lucide-react";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const courseRegSettingsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  isActive: z.boolean().default(false),
  registrationOpenDate: z.date().optional(),
  registrationCloseDate: z.date().optional(),
}).refine((data) => {
  if (data.registrationOpenDate && data.registrationCloseDate) {
    return data.registrationCloseDate > data.registrationOpenDate;
  }
  return true;
}, {
  message: "Closing date must be after the opening date.",
  path: ["registrationCloseDate"],
});

type CourseRegSettingsValues = z.infer<typeof courseRegSettingsSchema>;

export default function CourseRegistrationFormsPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);

  const form = useForm<CourseRegSettingsValues>({
    resolver: zodResolver(courseRegSettingsSchema),
    defaultValues: {
      title: "Course Registration",
      description: "Register for courses for the upcoming semester.",
      isActive: false,
    },
  });

  const fetchSettings = React.useCallback(async () => {
    setIsLoadingSettings(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/admin/form-settings?formType=courseRegistration");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to load course registration settings.");
      }
      const data = await response.json();
      if (data.settings) {
        form.reset({
          title: data.settings.title || "Course Registration",
          description: data.settings.description || "Register for courses for the upcoming semester.",
          isActive: data.settings.isActive === undefined ? false : data.settings.isActive,
          registrationOpenDate: data.settings.registrationOpenDate ? new Date(data.settings.registrationOpenDate) : undefined,
          registrationCloseDate: data.settings.registrationCloseDate ? new Date(data.settings.registrationCloseDate) : undefined,
        });
      }
    } catch (err: any) {
      console.error("Error fetching course registration settings:", err);
      setSubmitError(err.message);
      toast({ title: "Error Loading Settings", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingSettings(false);
    }
  }, [form]);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function onSubmit(data: CourseRegSettingsValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const payload = {
        formType: "courseRegistration",
        ...data,
        registrationOpenDate: data.registrationOpenDate ? data.registrationOpenDate.toISOString() : null,
        registrationCloseDate: data.registrationCloseDate ? data.registrationCloseDate.toISOString() : null,
      };
      const response = await fetch("/api/admin/form-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save course registration settings.");
      }
      toast({ title: "Settings Saved", description: "Course registration settings have been updated." });
      setSubmitSuccess("Course registration settings saved successfully!");
    } catch (err: any) {
      console.error("Error saving course registration settings:", err);
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
            <Link href="/admin/dashboard/forms"> {/* Updated back link */}
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Configure Course Registration</h1>
        </div>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Course Registration Settings
              </CardTitle>
              <CardDescription>
                Define the title, description, active status, and registration period.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSettings ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-10" />
                    <Skeleton className="h-4 w-20" />
                  </div>
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form Title</FormLabel>
                        <FormControl>
                          <Input placeholder="E.g., Fall 2024 Course Registration" {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Form Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter instructions for course registration."
                            className="resize-y min-h-[100px]"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Date pickers would be added here for registrationOpenDate and registrationCloseDate */}
                  {/* For brevity, I'm omitting the Radix UI Popover + Calendar setup for date inputs */}
                  {/* You can model them after the dateOfBirth field in the user-facing admission form */}
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Registration Open</FormLabel>
                          <CardDescription>
                            Allow users to access and submit course registrations.
                          </CardDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isSubmitting}
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
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Saving..." : "Save Settings"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
