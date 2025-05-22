
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Send, Loader2, Info, ShieldAlert, FileText, MessageSquareText, Printer, CheckCircle, RefreshCw } from "lucide-react";
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
import { auth, db, app as firebaseApp } from "@/lib/firebase/config";
import { User, onAuthStateChanged } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from 'date-fns';
import Image from "next/image";
import { cn } from "@/lib/utils";


const CUSTOM_FORM_ID = "mainGlobalCustomForm";

interface CustomFieldSetting {
  key: string;
  label: string;
  type: "text" | "textarea";
  isRequired: boolean;
}

interface CustomFormSettings {
  title: string;
  description: string;
  isActive: boolean;
  fields: CustomFieldSetting[];
}

// Function to dynamically create Zod schema
const createDynamicSchema = (fields: CustomFieldSetting[]) => {
  const shape: { [key: string]: z.ZodTypeAny } = {};
  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny;
    switch (field.type) {
      case "textarea":
        fieldSchema = z.string();
        if (field.isRequired) {
          fieldSchema = fieldSchema.min(1, { message: `${field.label} is required.` });
        } else {
          fieldSchema = fieldSchema.optional().or(z.literal("")); // Allow empty string for optional fields
        }
        break;
      case "text":
      default:
        fieldSchema = z.string();
        if (field.isRequired) {
          fieldSchema = fieldSchema.min(1, { message: `${field.label} is required.` });
        } else {
          fieldSchema = fieldSchema.optional().or(z.literal("")); // Allow empty string for optional fields
        }
        break;
    }
    shape[field.key] = fieldSchema;
  });
  return z.object(shape);
};


// Helper function to format values for display
const formatDisplayValue = (key: string, value: any): string | React.ReactNode => {
  if (value === null || typeof value === 'undefined') return <span className="italic text-muted-foreground">Not provided</span>;
  if (typeof value === 'boolean') return value ? "Yes" : "No";
  if ((key.toLowerCase().includes('date') || key.toLowerCase().includes('at') || key.toLowerCase().endsWith('dob')) && typeof value === 'string') {
    try {
      const dateFromISO = parseISO(value);
      if (!isNaN(dateFromISO.getTime())) return format(dateFromISO, "PP pp");
    } catch (e) { /* Not an ISO string, fall through */ }
    try {
      const dateFromGeneric = new Date(value);
      if (!isNaN(dateFromGeneric.getTime())) return format(dateFromGeneric, "PP pp");
    } catch (e) { /* Still not a valid date string, fall through */ }
  }
  if (value instanceof Date && !isNaN(value.getTime())) return format(value, "PP pp");
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) return "[Object Data - See Below]";
  return String(value);
};

// Recursive function to render form details
const renderDetailItem = (label: string, value: any, indentLevel = 0): React.ReactNode => {
  const prettyLabel = label
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase());

  if ((label === 'formData' || label === 'details') && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    return (
      <div key={label} className={cn(`mb-3 printable-data-item`, indentLevel > 0 && `ml-${indentLevel * 4}`)}>
        <dt className="font-semibold text-base text-foreground border-b pb-1 mb-2 printable-data-label">{prettyLabel}</dt>
        <dd className={`ml-0 mt-1 space-y-2`}>
          {Object.keys(value).length > 0 ? (
            <dl className="space-y-1 ml-4 pl-4 border-l border-muted nested-dl-print">
              {Object.entries(value).map(([subKey, subValue]) =>
                renderDetailItem(subKey, subValue, indentLevel + 1) 
              )}
            </dl>
          ) : (
            <span className="italic ml-4">No additional details provided.</span>
          )}
        </dd>
      </div>
    );
  }

  return (
    <div key={label} className={cn(`printable-data-item`, indentLevel > 0 ? `ml-${indentLevel * 4}` : '')}>
      <dt className="font-semibold text-sm text-foreground printable-data-label">{prettyLabel}:</dt>
      <dd className="ml-4 text-sm text-muted-foreground break-words">{formatDisplayValue(label, value)}</dd>
    </div>
  );
};

export default function UserCustomFormPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [formSettings, setFormSettings] = React.useState<CustomFormSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  const [submittedData, setSubmittedData] = React.useState<Record<string, any> | null>(null);
  const [isLoadingPage, setIsLoadingPage] = React.useState(true);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);


  const form = useForm<any>({
    defaultValues: {},
  });

  const fetchFormDefinition = React.useCallback(async () => {
    setIsLoadingSettings(true);
    setSettingsError(null);
    console.log("UserCustomFormPage: Fetching form definition for", CUSTOM_FORM_ID);
    try {
      const response = await fetch(`/api/admin/custom-form-settings?formId=${CUSTOM_FORM_ID}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to fetch custom form settings.");
      }
      const data = await response.json();
      if (data.settings) {
        console.log("UserCustomFormPage: Form settings received:", data.settings);
        setFormSettings(data.settings);
        const dynamicSchema = createDynamicSchema(data.settings.fields || []);
        const defaultVals = (data.settings.fields || []).reduce((acc: Record<string, string>, field: CustomFieldSetting) => {
          acc[field.key] = "";
          return acc;
        }, {});
        form.reset(defaultVals, {
          resolver: zodResolver(dynamicSchema),
        });
      } else {
        throw new Error("Form definition not found or is invalid.");
      }
    } catch (error: any) {
      console.error("UserCustomFormPage: Error fetching form settings:", error);
      setSettingsError(error.message);
      toast({ title: "Error Loading Form Configuration", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingSettings(false);
    }
  }, [form]);

  React.useEffect(() => {
    console.log("UserCustomFormPage: Auth effect running.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("UserCustomFormPage: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (user) {
        fetchFormDefinition();
      } else {
        setIsLoadingPage(false);
        setIsLoadingSettings(false); // Also stop settings loading if no user
        setSettingsError("You must be logged in to view this form.");
      }
    });
    return () => {
      console.log("UserCustomFormPage: Cleaning up auth subscription.");
      unsubscribe();
    };
  }, [fetchFormDefinition]);

  React.useEffect(() => {
    if (!isLoadingSettings && currentUser) {
      setIsLoadingPage(false);
    } else if (!currentUser && !isLoadingSettings) { // If no user and settings not loading, page is ready
      setIsLoadingPage(false);
    }
  }, [isLoadingSettings, currentUser]);


  async function onSubmit(data: Record<string, any>) {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to submit this form.", variant: "destructive" });
      return;
    }
    if (!formSettings?.isActive) {
      toast({ title: "Form Closed", description: "This form is currently not accepting submissions.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    console.log("UserCustomFormPage: Submitting custom form data:", data);

    try {
      const idToken = await currentUser.getIdToken(true);
      const response = await fetch("/api/forms/custom-submission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({ formId: CUSTOM_FORM_ID, formData: data }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to submit custom form.");
      }
      
      const result = await response.json();
      console.log("UserCustomFormPage: Custom form submission successful:", result);
      setSubmittedData(data); // Store submitted data for printing
      setHasSubmitted(true); // Mark as submitted in this session
      toast({
        title: "Form Submitted",
        description: `${formSettings?.title || 'Your form'} has been submitted successfully.`,
      });
    } catch (error: any) {
      console.error("UserCustomFormPage: Custom form submission error:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handlePrint = () => {
    console.log("UserCustomFormPage: Print button clicked...");
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    } else {
      console.warn("UserCustomFormPage: window.print is not available. This might be due to a sandboxed environment.");
      toast({
        title: "Print Not Available",
        description: "Printing is not available in this environment. Please try opening the page in a new tab or standard browser window if you are in an embedded view.",
        variant: "default",
        duration: 7000,
      });
    }
  };

  const handleSubmitAnother = () => {
    setSubmittedData(null);
    setHasSubmitted(false); // Allow new submission
    if (formSettings) { 
         const defaultVals = formSettings.fields.reduce((acc, field) => {
            acc[field.key] = "";
            return acc;
        }, {} as Record<string, string>);
        form.reset(defaultVals);
    }
  };

  if (isLoadingPage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end">
            <Skeleton className="h-10 w-28" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (settingsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings?.title || "Custom Form"}</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldAlert className="h-6 w-6 text-destructive"/>Error Loading Form</CardTitle>
            <CardDescription>There was an issue loading the form configuration.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{settingsError}</p>
            <p className="text-muted-foreground mt-2">Please try again later or contact support. Ensure the form (ID: {CUSTOM_FORM_ID}) is configured by an admin.</p>
             <Button onClick={fetchFormDefinition} variant="outline" className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" /> Try Reloading Form
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!formSettings || !formSettings.fields || formSettings.fields.length === 0) {
     return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Custom Form</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-6 w-6 text-primary"/>Form Not Configured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This custom form has not been configured by the administrator yet or has no fields defined.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formSettings.isActive && !submittedData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings.title}</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-6 w-6 text-primary"/>Form Currently Closed</CardTitle>
            <CardDescription>{formSettings.description || "This form is not currently accepting submissions."}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please check back later or contact the administration for more information.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submittedData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link href="/user/dashboard/forms">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-3xl font-bold tracking-tight">{formSettings.title} - Submission</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Print Submission
            </Button>
            <Button variant="outline" onClick={handleSubmitAnother}>Submit Another Response</Button>
          </div>
        </div>
        
        <Card className="shadow-lg max-w-2xl mx-auto no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-500" />Submission Successful!</CardTitle>
            <CardDescription>{formSettings.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your response for "{formSettings.title}" has been recorded. You can print a copy for your records or submit another response.
            </p>
            <Button variant="ghost" asChild>
                 <Link href="/user/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>

        <div id="printable-area" className="printable-area print-only">
          <div className="printable-header">
             <Image src="https://icon2.cleanpng.com/20180627/vy/aayjnkno0.webp" alt="Amity University Logo" data-ai-hint="university logo" width={60} height={60} className="printable-logo" />
            <div className="printable-header-text">
              <h2>Amity University Madhya Pradesh</h2>
              <p>{formSettings.title}</p>
            </div>
          </div>
          <h3 className="text-xl font-semibold my-4 text-center">Form Submission Details</h3>
          <dl className="space-y-3 printable-data-item">
            {formSettings.fields.map((fieldSetting) => 
                renderDetailItem(fieldSetting.label, submittedData[fieldSetting.key])
            )}
             <div className="printable-data-item">
                <dt className="font-semibold text-sm text-foreground printable-data-label">Submitted On:</dt>
                <dd className="ml-4 text-sm text-muted-foreground break-words">{format(new Date(), "PP pp")}</dd> 
             </div>
             {currentUser?.email && (
                <div className="printable-data-item">
                    <dt className="font-semibold text-sm text-foreground printable-data-label">Submitted By:</dt>
                    <dd className="ml-4 text-sm text-muted-foreground break-words">{currentUser.email}</dd>
                </div>
             )}
          </dl>
          <div className="printable-footer">
            <p>Contact: admissions@sathicollege.edu | Phone: +91-123-4567890</p>
            <p>Sathi College, Gwalior, Madhya Pradesh, India</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 no-print">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings.title}</h1>
        </div>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{formSettings.title}</CardTitle>
              <CardDescription>
                {formSettings.description || "Please fill out the details below."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formSettings.fields.map((fieldSetting) => (
                <FormField
                  key={fieldSetting.key}
                  control={form.control}
                  name={fieldSetting.key}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fieldSetting.label}{fieldSetting.isRequired && <span className="text-destructive">*</span>}</FormLabel>
                      <FormControl>
                        {fieldSetting.type === "textarea" ? (
                          <Textarea
                            placeholder={`Enter ${fieldSetting.label.toLowerCase()}`}
                            {...field}
                            value={field.value || ''} 
                            disabled={isSubmitting}
                            className="resize-y min-h-[100px]"
                          />
                        ) : (
                          <Input
                            type={fieldSetting.type === "text" ? "text" : "text"} // Could be extended for other HTML input types
                            placeholder={`Enter ${fieldSetting.label.toLowerCase()}`}
                            {...field}
                            value={field.value || ''} 
                            disabled={isSubmitting}
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isSubmitting || !formSettings.isActive}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
    
