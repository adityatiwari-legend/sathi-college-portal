
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Send, Loader2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/config";
import { Skeleton } from "@/components/ui/skeleton";

interface CustomFormField {
  fieldKey: string;
  label: string;
  type: "text" | "textarea";
  isRequired: boolean;
}

interface CustomFormSettings {
  title: string;
  description: string;
  isActive: boolean;
  fields: CustomFormField[];
}

const CUSTOM_FORM_ID = "mainGlobalCustomForm";

export default function UserCustomFormPage() {
  const [formSettings, setFormSettings] = React.useState<CustomFormSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const dynamicFormSchema = React.useMemo(() => {
    if (!formSettings || !formSettings.fields) {
      return z.object({}); // Return an empty schema if no fields
    }
    const shape: Record<string, z.ZodTypeAny> = {};
    formSettings.fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      if (field.type === "textarea") {
        fieldSchema = z.string().max(1000, "Max 1000 characters");
      } else { // text
        fieldSchema = z.string().max(250, "Max 250 characters");
      }
      if (field.isRequired) {
        fieldSchema = fieldSchema.min(1, `${field.label} is required.`);
      } else {
        fieldSchema = fieldSchema.optional();
      }
      shape[field.fieldKey] = fieldSchema;
    });
    return z.object(shape);
  }, [formSettings]);

  const form = useForm<z.infer<typeof dynamicFormSchema>>({
    resolver: zodResolver(dynamicFormSchema),
    defaultValues: {}, // Default values will be set once settings are loaded
  });

  React.useEffect(() => {
    async function fetchSettings() {
      setIsLoadingSettings(true);
      setSettingsError(null);
      try {
        const response = await fetch(`/api/admin/custom-form-settings?formId=${CUSTOM_FORM_ID}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || `Failed to load form settings.`);
        }
        const data = await response.json();
        if (data.settings && data.settings.isActive) {
          setFormSettings(data.settings);
          // Set default values for the form based on fetched fields
          const defaults: Record<string, any> = {};
          data.settings.fields?.forEach((field: CustomFormField) => {
            defaults[field.fieldKey] = "";
          });
          form.reset(defaults);
        } else {
          setSettingsError(data.settings?.isActive === false ? "This form is currently not active." : "Custom form not found or not active.");
        }
      } catch (err: any) {
        setSettingsError(err.message);
        toast({ title: "Error Loading Form", description: err.message, variant: "destructive" });
      } finally {
        setIsLoadingSettings(false);
      }
    }
    fetchSettings();
  }, [form]);

  async function onSubmit(data: z.infer<typeof dynamicFormSchema>) {
    setIsSubmitting(true);
    const user = auth.currentUser;
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const response = await fetch("/api/forms/custom-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ formId: CUSTOM_FORM_ID, formData: data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to submit form.");
      }
      toast({ title: "Form Submitted", description: "Your response has been recorded." });
      form.reset();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader><Skeleton className="h-7 w-1/3 mb-1" /><Skeleton className="h-4 w-2/3" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
        </Card>
      </div>
    );
  }

  if (settingsError || !formSettings || !formSettings.isActive) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings?.title || "Custom Form"}</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader><CardTitle>Form Not Available</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{settingsError || "This form is currently unavailable."}</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings.title}</h1>
        </div>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{formSettings.title}</CardTitle>
              <CardDescription>{formSettings.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formSettings.fields.map((field) => (
                <FormField
                  key={field.fieldKey}
                  control={form.control}
                  name={field.fieldKey as any} // Type assertion needed for dynamic field names
                  render={({ field: formField }) => (
                    <FormItem>
                      <FormLabel>{field.label}{field.isRequired && <span className="text-destructive"> *</span>}</FormLabel>
                      <FormControl>
                        {field.type === "textarea" ? (
                          <Textarea placeholder={`Enter ${field.label.toLowerCase()}`} {...formField} disabled={isSubmitting} />
                        ) : (
                          <Input placeholder={`Enter ${field.label.toLowerCase()}`} {...formField} disabled={isSubmitting} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Submitting..." : "Submit Response"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
