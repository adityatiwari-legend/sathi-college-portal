
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Send, Loader2, Info, ShieldAlert, FileText, MessageSquareText, CheckCircle, RefreshCw, Printer } from "lucide-react";
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
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
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

const createDynamicSchema = (fields: CustomFieldSetting[]) => {
  const shape: { [key: string]: z.ZodTypeAny } = {};
  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny;
    switch (field.type) {
      case "textarea":
        fieldSchema = z.string();
        if (field.isRequired) {
          fieldSchema = fieldSchema.min(1, { message: `${field.label} is required.` }).max(2000, "Input too long");
        } else {
          fieldSchema = fieldSchema.max(2000, "Input too long").optional().or(z.literal(""));
        }
        break;
      case "text":
      default:
        fieldSchema = z.string();
        if (field.isRequired) {
          fieldSchema = fieldSchema.min(1, { message: `${field.label} is required.` }).max(255, "Input too long");
        } else {
          fieldSchema = fieldSchema.max(255, "Input too long").optional().or(z.literal(""));
        }
        break;
    }
    shape[field.key] = fieldSchema;
  });
  return z.object(shape);
};

// Helper function to format values for display
const formatDisplayValue = (key: string, value: any): string | React.ReactNode => {
  if (value === null || typeof value === 'undefined' || value === "") return <span className="italic text-muted-foreground">Not provided</span>;
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
  if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
    if (key === 'formData' || key === 'details') {
        return <span className="italic text-muted-foreground">[Details below]</span>;
    }
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};

const renderFieldDetail = (fieldSetting: CustomFieldSetting, value: any) => {
  const prettyLabel = fieldSetting.label
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^./, (str) => str.toUpperCase());

  return (
    <React.Fragment key={fieldSetting.key}>
      <dt className="font-semibold text-sm text-foreground printable-data-label">{prettyLabel}:</dt>
      <dd className="ml-4 text-sm text-muted-foreground break-words">{formatDisplayValue(fieldSetting.key, value)}</dd>
    </React.Fragment>
  );
};


export default function UserCustomFormPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [formSettings, setFormSettings] = React.useState<CustomFormSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true); // For checking previous submissions
  const [hasSubmittedPreviously, setHasSubmittedPreviously] = React.useState(false);
  const [submittedData, setSubmittedData] = React.useState<Record<string, any> | null>(null);
  const [isLoadingPage, setIsLoadingPage] = React.useState(true);

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
        // Initialize form with dynamic schema and default values
        const dynamicSchema = createDynamicSchema(data.settings.fields || []);
        const defaultVals = (data.settings.fields || []).reduce((acc: Record<string, string>, field: CustomFieldSetting) => {
          acc[field.key] = "";
          return acc;
        }, {});
        form.reset(defaultVals, { 
          resolver: zodResolver(dynamicSchema) as any, // Cast to any if type inference is tricky
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

  const checkPreviousSubmission = React.useCallback(async (user: User) => {
    if (!user || !db || !formSettings?.fields || formSettings.fields.length === 0) {
        setIsLoadingStatus(false);
        return;
    }
    setIsLoadingStatus(true);
    console.log(`UserCustomFormPage: Checking previous submission for user ${user.uid} and formId ${CUSTOM_FORM_ID}`);
    try {
      const submissionsRef = collection(db, "customFormSubmissions");
      const q = query(submissionsRef, 
        where("userId", "==", user.uid), 
        where("formId", "==", CUSTOM_FORM_ID),
        orderBy("submittedAt", "desc"), // To get the latest if needed, though we just check existence
        // limit(1) // We only need to know if at least one exists
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        console.log(`UserCustomFormPage: Previous submission found for user ${user.uid} and formId ${CUSTOM_FORM_ID}.`);
        setHasSubmittedPreviously(true);
      } else {
        console.log(`UserCustomFormPage: No previous submission found for user ${user.uid} and formId ${CUSTOM_FORM_ID}.`);
        setHasSubmittedPreviously(false);
      }
    } catch (error: any) {
      console.error("UserCustomFormPage: Error checking existing custom submission:", error);
      // Don't block form display for this, just log it.
      toast({ title: "Info", description: "Could not verify previous submissions, proceed with caution.", variant: "default" });
    } finally {
      setIsLoadingStatus(false);
    }
  }, [formSettings]);

  React.useEffect(() => {
    console.log("UserCustomFormPage: Auth effect running.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("UserCustomFormPage: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (user) {
        fetchFormDefinition(); 
      } else {
        setIsLoadingPage(false);
        setIsLoadingSettings(false); 
        setSettingsError("You must be logged in to view this form.");
      }
    });
    return () => {
      console.log("UserCustomFormPage: Cleaning up auth subscription.");
      unsubscribe();
    };
  }, [fetchFormDefinition]);
  
  React.useEffect(() => {
    if (currentUser && formSettings) {
      // Check for previous submissions once both user and form settings are loaded
      // This check is now part of the original design we are reverting
      // checkPreviousSubmission(currentUser);
    }
  }, [currentUser, formSettings, checkPreviousSubmission]);

  React.useEffect(() => {
    if (!isLoadingSettings && (!currentUser || currentUser)) { 
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
        const serverErrorMessage = errorData.error?.message || "Failed to submit custom form.";
        console.error("UserCustomFormPage: Custom form submission API error:", serverErrorMessage, "Full response:", errorData);
        throw new Error(serverErrorMessage);
      }
      
      const result = await response.json();
      console.log("UserCustomFormPage: Custom form submission successful:", result);
      setSubmittedData(data); 
      toast({
        title: "Form Submitted",
        description: `${formSettings?.title || 'Your form'} has been submitted successfully.`,
      });
      // Do not reset the form here if we are showing the submitted data immediately
    } catch (error: any) {
      console.error("UserCustomFormPage: Custom form submission error (client-side catch):", error);
      toast({
        title: "Submission Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleSubmitAnother = () => {
    setSubmittedData(null); // Clear submitted data to show the form again
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
  
  if (!formSettings || !formSettings.fields) { // Allow empty fields array for now
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
            <p className="text-muted-foreground">This custom form has not been fully configured by the administrator yet.</p>
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
              <h1 className="text-3xl font-bold tracking-tight">{formSettings.title} - Submission Receipt</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSubmitAnother}>Submit Another Response</Button>
            <Button asChild><Link href="/user/dashboard">Back to Dashboard</Link></Button>
          </div>
        </div>
        
        <div className="p-4 my-4 border rounded-md bg-green-50 border-green-200 text-green-700 flex items-center gap-2 no-print">
          <CheckCircle className="h-5 w-5" />
          <p className="text-sm">Your response for "{formSettings.title}" has been recorded. You can print this page (using Ctrl+P or Cmd+P) for your records.</p>
        </div>

        {/* This is the actual printable content, now also visible on screen after submission */}
        <div id="printable-area" className="printable-area bg-card text-card-foreground shadow-md p-6 md:p-8 rounded-lg max-w-3xl mx-auto mt-4"> 
          <div className="printable-header">
             <Image src="https://icon2.cleanpng.com/20180627/vy/aayjnkno0.webp" alt="Amity University Logo" data-ai-hint="university logo" width={60} height={60} className="printable-logo" />
            <div className="printable-header-text">
              <h2 className="text-xl font-bold">Amity University Madhya Pradesh</h2>
              <p className="text-sm">{formSettings.title}</p>
            </div>
          </div>
          <hr className="my-4 no-print" />
          
          <h3 className="text-lg font-semibold my-4 text-center">Form Submission Details</h3>
          <dl className="space-y-2">
            {formSettings.fields.map((fieldSetting) => 
              renderFieldDetail(fieldSetting, submittedData[fieldSetting.key])
            )}
             <div className="printable-data-item">
                <dt className="font-semibold text-sm text-foreground printable-data-label">Submitted On:</dt>
                <dd className="ml-4 text-sm text-muted-foreground">{format(new Date(), "PP pp")}</dd> 
             </div>
             {currentUser?.email && (
                <div className="printable-data-item">
                    <dt className="font-semibold text-sm text-foreground printable-data-label">Submitted By:</dt>
                    <dd className="ml-4 text-sm text-muted-foreground">{currentUser.email}</dd>
                </div>
             )}
          </dl>
          
          <hr className="my-6 border-dashed no-print" />
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
              {(formSettings.fields || []).map((fieldSetting) => (
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
                            type={fieldSetting.type === "text" ? "text" : "text"}
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
    

    