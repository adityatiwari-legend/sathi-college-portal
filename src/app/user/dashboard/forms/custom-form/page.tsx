
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Send, Loader2, AlertTriangle, Info, ShieldCheck } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

interface CustomFormFieldDef {
  fieldKey: string;
  label: string;
  type: "text" | "textarea";
  isRequired: boolean;
}

interface CustomFormSettings {
  title: string;
  description: string;
  isActive: boolean;
  fields: CustomFormFieldDef[];
}

const CUSTOM_FORM_ID = "mainGlobalCustomForm";

export default function UserCustomFormPage() {
  const [formSettings, setFormSettings] = React.useState<CustomFormSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);

  const dynamicFormSchema = React.useMemo(() => {
    if (!formSettings || !formSettings.fields) {
      return z.object({}); 
    }
    const shape: Record<string, z.ZodTypeAny> = {};
    formSettings.fields.forEach(field => {
      let fieldSchema: z.ZodTypeAny;
      if (field.type === "textarea") {
        fieldSchema = z.string().max(1000, "Max 1000 characters");
      } else { 
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
    defaultValues: {},
  });

  React.useEffect(() => {
    async function fetchSettingsAndStatus() {
      setIsLoadingSettings(true);
      setIsLoadingStatus(true);
      setSettingsError(null);
      
      try {
        const settingsResponse = await fetch(`/api/admin/custom-form-settings?formId=${CUSTOM_FORM_ID}`);
        if (!settingsResponse.ok) {
          const errorData = await settingsResponse.json();
          throw new Error(errorData.error?.message || `Failed to load form settings.`);
        }
        const settingsData = await settingsResponse.json();

        if (settingsData.settings && settingsData.settings.isActive) {
          setFormSettings(settingsData.settings);
          const defaults: Record<string, any> = {};
          settingsData.settings.fields?.forEach((field: CustomFormFieldDef) => {
            defaults[field.fieldKey] = "";
          });
          form.reset(defaults);
        } else {
          setSettingsError(settingsData.settings?.isActive === false ? "This form is currently not active." : "Custom form not found or not active.");
          setIsLoadingSettings(false);
          setIsLoadingStatus(false);
          return; 
        }
      } catch (err: any) {
        setSettingsError(err.message);
        toast({ title: "Error Loading Form", description: err.message, variant: "destructive" });
        setIsLoadingSettings(false);
        setIsLoadingStatus(false);
        return;
      }
      setIsLoadingSettings(false);

      // Now check submission status if form is active and settings loaded
      if (auth.currentUser && db) {
        const customSubmissionsRef = collection(db, "customFormSubmissions");
        const q = query(customSubmissionsRef, where("userId", "==", auth.currentUser.uid), where("formId", "==", CUSTOM_FORM_ID), limit(1));
        try {
          const querySnapshot = await getDocs(q);
          setHasSubmitted(!querySnapshot.empty);
          if (!querySnapshot.empty) {
            toast({ title: "Form Already Submitted", description: "You have already submitted this custom form." });
          }
        } catch (error) {
          console.error("Error checking existing custom submission:", error);
          toast({ title: "Error", description: "Could not verify previous custom form submissions.", variant: "destructive" });
        } finally {
          setIsLoadingStatus(false);
        }
      } else {
        setIsLoadingStatus(false);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchSettingsAndStatus();
      } else {
        setFormSettings(null);
        setHasSubmitted(false);
        setIsLoadingSettings(false);
        setIsLoadingStatus(false);
        setSettingsError("You must be logged in to view this form.");
      }
    });
    return () => unsubscribe();
  }, [form]);


  async function onSubmit(data: z.infer<typeof dynamicFormSchema>) {
    if (hasSubmitted) {
      toast({ title: "Already Submitted", description: "You have already submitted this form.", variant: "info" });
      return;
    }
    if (!formSettings?.isActive) {
       toast({ title: "Form Closed", description: "This form is currently not active.", variant: "warning" });
       return;
    }

    setIsSubmitting(true);
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
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
        let errorData = { error: { message: "Failed to submit form."} };
        try {
            errorData = await response.json();
        } catch(e) {
            errorData.error.message = `Failed to submit. Server responded with status ${response.status}.`;
        }
        throw new Error(errorData.error.message);
      }
      toast({ title: "Form Submitted", description: "Your response has been recorded." });
      form.reset();
      setHasSubmitted(true);
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingSettings || isLoadingStatus) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader><Skeleton className="h-7 w-1/3 mb-1" /><Skeleton className="h-4 w-2/3" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-28 ml-auto" /></CardFooter>
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
          <CardHeader><CardTitle className="flex items-center gap-2"><Info className="h-6 w-6 text-destructive"/>Form Not Available</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">{settingsError || "This form is currently unavailable or not active."}</p></CardContent>
        </Card>
      </div>
    );
  }

  if (hasSubmitted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings.title}</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-green-500"/>Response Submitted</CardTitle>
            <CardDescription>You have already submitted this form.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you for your submission. You can view your activity in the "My Activity" section.
            </p>
            <Button asChild className="mt-4">
              <Link href="/user/dashboard/my-activity">View My Activity</Link>
            </Button>
          </CardContent>
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
                  name={field.fieldKey as any} 
                  render={({ field: formHookField }) => ( // renamed to avoid conflict with loop variable 'field'
                    <FormItem>
                      <FormLabel>{field.label}{field.isRequired && <span className="text-destructive"> *</span>}</FormLabel>
                      <FormControl>
                        {field.type === "textarea" ? (
                          <Textarea placeholder={`Enter ${field.label.toLowerCase()}`} {...formHookField} disabled={isSubmitting} />
                        ) : (
                          <Input placeholder={`Enter ${field.label.toLowerCase()}`} {...formHookField} disabled={isSubmitting} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isSubmitting || hasSubmitted || !formSettings.isActive}>
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

    