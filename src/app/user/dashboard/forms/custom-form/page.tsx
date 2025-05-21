
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form"; // Added useFieldArray
import * as z from "zod";
import { ArrowLeft, Send, Loader2, Info, ShieldAlert, FileText, MessageSquareText, Printer } from "lucide-react";
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
import { auth, db } from "@/lib/firebase/config"; // Ensure db is imported if needed for submission status check
import { User } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore"; // For submission status check
import { format } from 'date-fns';

const CUSTOM_FORM_ID = "mainGlobalCustomForm"; // This is the ID of the form settings document

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

// Dynamically create Zod schema based on form settings
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
          fieldSchema = fieldSchema.optional();
        }
        break;
      case "text":
      default:
        fieldSchema = z.string();
        if (field.isRequired) {
          fieldSchema = fieldSchema.min(1, `${field.label} is required.`);
        } else {
          fieldSchema = fieldSchema.optional();
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
  
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(false); 
  const [submittedData, setSubmittedData] = React.useState<Record<string, any> | null>(null);


  // The form instance will be re-initialized once settings are fetched
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
        resolver: zodResolver(dynamicSchema) as any, // Need to cast due to dynamic nature
      });
    }
  }, [formSettings, form]);


  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const fetchSettingsAndStatus = async () => {
      setIsLoadingSettings(true);
      setIsLoadingStatus(true);
      setSettingsError(null);
      setSubmittedData(null); // Clear previous submission display on reload

      try {
        const settingsResponse = await fetch(`/api/admin/custom-form-settings?formId=${CUSTOM_FORM_ID}`);
        if (!settingsResponse.ok) {
          const errorData = await settingsResponse.json();
          throw new Error(errorData.error?.message || "Failed to fetch custom form settings.");
        }
        const settingsData = await settingsResponse.json();
        setFormSettings(settingsData.settings);

        if (currentUser && settingsData.settings?.isActive) {
          const submissionsCollection = collection(db, "customFormSubmissions");
          const q = query(
            submissionsCollection,
            where("userId", "==", currentUser.uid),
            where("formId", "==", CUSTOM_FORM_ID)
          );
          const querySnapshot = await getDocs(q);
          setHasSubmitted(!querySnapshot.empty);
        } else {
          setHasSubmitted(false);
        }

      } catch (error: any) {
        setSettingsError(error.message);
        toast({ title: "Error Loading Form", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingSettings(false);
        setIsLoadingStatus(false);
      }
    };
    if(currentUser === null && auth.currentUser) { // If auth state already known
        setCurrentUser(auth.currentUser);
    }
    if (currentUser !== undefined) { // Run once currentUser is determined (null or User object)
        fetchSettingsAndStatus();
    }

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
      
      setSubmittedData(data); // Store submitted data to display for printing
      setHasSubmitted(true); // Mark as submitted for this session
      toast({
        title: "Form Submitted",
        description: `${formSettings?.title || 'Your form'} has been submitted successfully.`,
      });
      // form.reset(); // Don't reset immediately if we want to show data for printing
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
    setSubmittedData(null);
    setHasSubmitted(false); // Or true if you want the "already submitted" message for subsequent attempts in same session
    if (formSettings) { // Re-initialize form with default values from settings
         const defaultVals = formSettings.fields.reduce((acc, field) => {
            acc[field.key] = "";
            return acc;
        }, {} as Record<string, string>);
        form.reset(defaultVals);
    }
  };


  if (isLoadingSettings || isLoadingStatus) {
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


  if (!formSettings.isActive) {
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings.title} - Submission</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle className="h-6 w-6 text-green-500" />Submission Successful!</CardTitle>
            <CardDescription>{formSettings.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Your response for "{formSettings.title}" has been recorded. You can print a copy for your records.
            </p>
            <div className="space-x-2 no-print">
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
                            disabled={isSubmitting}
                            className="resize-y min-h-[100px]"
                          />
                        ) : (
                          <Input
                            type={fieldSetting.type === "text" ? "text" : "text"} // Add more types if needed
                            placeholder={`Enter ${fieldSetting.label.toLowerCase()}`}
                            {...field}
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
