
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Send, Loader2, Info, ShieldAlert, FileText, MessageSquareText, Printer, CheckCircle } from "lucide-react"; // Added CheckCircle
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
import { auth, db } from "@/lib/firebase/config";
import { User } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { format } from 'date-fns';

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
  const schemaObject: Record<string, z.ZodTypeAny> = {};
  fields.forEach(field => {
    let fieldSchema: z.ZodTypeAny;
    switch (field.type) {
      case "textarea":
        fieldSchema = z.string();
        if (field.isRequired) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required.`);
        } else {
          fieldSchema = fieldSchema.optional().or(z.literal(""));
        }
        break;
      case "text":
      default:
        fieldSchema = z.string();
        if (field.isRequired) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required.`);
        } else {
          fieldSchema = fieldSchema.optional().or(z.literal(""));
        }
        break;
    }
    schemaObject[field.key] = fieldSchema;
  });
  return z.object(schemaObject);
};

export default function UserCustomFormPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [formSettings, setFormSettings] = React.useState<CustomFormSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  
  // isLoadingStatus is used for the initial check if a form has already been submitted
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true); 
  // hasSubmitted is used to display the "already submitted" message
  const [hasSubmitted, setHasSubmitted] = React.useState(false); 
  // submittedData stores the data of the current successful submission for printing
  const [submittedData, setSubmittedData] = React.useState<Record<string, any> | null>(null);

  const form = useForm<any>({ 
    resolver: formSettings ? zodResolver(createDynamicSchema(formSettings.fields)) : undefined,
    defaultValues: {},
  });

  React.useEffect(() => {
    if (formSettings) {
      const dynamicSchema = createDynamicSchema(formSettings.fields);
      const defaultVals = formSettings.fields.reduce((acc, field) => {
        acc[field.key] = "";
        return acc;
      }, {} as Record<string, string>);
      
      form.reset(defaultVals, {
        // @ts-ignore
        resolver: zodResolver(dynamicSchema), 
      });
    }
  }, [formSettings, form]);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) { // If user logs out or is not logged in initially
        setIsLoadingSettings(false); // Stop settings loading if no user
        setIsLoadingStatus(false); // Stop status loading if no user
        setHasSubmitted(false); // Reset submission status
        setSubmittedData(null); // Reset submitted data
      }
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const fetchInitialData = async () => {
      if (!currentUser) {
        setIsLoadingSettings(false);
        setIsLoadingStatus(false);
        return;
      }

      setIsLoadingSettings(true);
      setIsLoadingStatus(true); // Start loading status
      setSettingsError(null);
      setHasSubmitted(false); // Reset for each user/load
      setSubmittedData(null); // Clear any previous print data

      try {
        // Fetch form settings
        const settingsResponse = await fetch(`/api/admin/custom-form-settings?formId=${CUSTOM_FORM_ID}`);
        if (!settingsResponse.ok) {
          const errorData = await settingsResponse.json();
          throw new Error(errorData.error?.message || "Failed to fetch custom form settings.");
        }
        const settingsData = await settingsResponse.json();
        setFormSettings(settingsData.settings);
        
        // If settings fetched and form is active, check for previous submission
        // This check is no longer needed since we allow multiple submissions.
        // Keeping the structure for hasSubmitted in case it's reintroduced later.
        // For now, we assume no previous submission blocks a new one.
        setHasSubmitted(false); 
        setIsLoadingStatus(false);

      } catch (error: any) {
        setSettingsError(error.message);
        toast({ title: "Error Loading Form Configuration", description: error.message, variant: "destructive" });
        setIsLoadingSettings(false);
        setIsLoadingStatus(false);
      }
    };

    fetchInitialData();
  }, [currentUser]); // Re-fetch if user changes

  async function onSubmit(data: Record<string, any>) {
    if (!formSettings?.isActive) {
      toast({ title: "Form Closed", description: "This form is currently not accepting submissions.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in to submit this form.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    try {
      const idToken = await currentUser.getIdToken();
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
        throw new Error(errorData.error?.message || "Failed to submit custom form.");
      }
      
      const result = await response.json(); // Get result for logging, if needed
      console.log("Custom form submission successful:", result);
      setSubmittedData(data); // Store submitted data for printing
      setHasSubmitted(true); // Mark as submitted for this session's view
      toast({
        title: "Form Submitted",
        description: `${formSettings?.title || 'Your form'} has been submitted successfully.`,
      });
      // We don't reset the form here immediately, because we want to show the 'submittedData' view
    } catch (error: any) {
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
    window.print();
  };

  const handleSubmitAnother = () => {
    setSubmittedData(null); // Clear current submitted data view
    setHasSubmitted(false); // Allow new submission
    if (formSettings) { 
         const defaultVals = formSettings.fields.reduce((acc, field) => {
            acc[field.key] = "";
            return acc;
        }, {} as Record<string, string>);
        form.reset(defaultVals);
    }
  };

  if (isLoadingSettings || (isLoadingStatus && !submittedData)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
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
            <p className="text-muted-foreground mt-2">Please try again later or contact support.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!formSettings || !formSettings.fields) {
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
            <p className="text-muted-foreground">This custom form has not been configured by the administrator yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formSettings.isActive && !submittedData) { // Only show "Form Closed" if not viewing a just-submitted form
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings.title || "Custom Form"}</h1>
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
        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings.title} - Submission</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-500" />Submission Successful!</CardTitle>
            <CardDescription>{formSettings.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your response for "{formSettings.title}" has been recorded. You can print a copy for your records.
            </p>
            <div className="space-x-2">
              <Button onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print Submission
              </Button>
              <Button variant="outline" onClick={handleSubmitAnother}>Submit Another Response</Button>
              <Button variant="ghost" asChild>
                 <Link href="/user/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div id="printable-area" className="printable-area hidden">
          <div className="printable-header">
            <img src="https://icon2.cleanpng.com/20180627/vy/aayjnkno0.webp" alt="Amity University Logo" data-ai-hint="university logo" className="printable-logo" />
            <div className="printable-header-text">
              <h2>Amity University Madhya Pradesh</h2>
              <p>{formSettings.title}</p>
            </div>
          </div>
          <h3 className="text-xl font-semibold my-4 text-center">Form Submission Details</h3>
          <dl className="space-y-3">
            {formSettings.fields.map((fieldSetting) => (
              <div key={fieldSetting.key} className="printable-data-item">
                <dt className="font-semibold printable-data-label">{fieldSetting.label}:</dt>
                <dd className="ml-4 break-words">
                  {typeof submittedData[fieldSetting.key] === 'boolean'
                    ? submittedData[fieldSetting.key] ? 'Yes' : 'No'
                    : submittedData[fieldSetting.key]?.toString() || <span className="text-muted-foreground italic">Not provided</span>}
                </dd>
              </div>
            ))}
             <div className="printable-data-item">
                <dt className="font-semibold printable-data-label">Submitted On:</dt>
                <dd className="ml-4">{format(new Date(), "PP pp")}</dd> 
             </div>
             {currentUser?.email && (
                <div className="printable-data-item">
                    <dt className="font-semibold printable-data-label">Submitted By:</dt>
                    <dd className="ml-4">{currentUser.email}</dd>
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
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings.title}</h1>
        </div>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto no-print">
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
    
