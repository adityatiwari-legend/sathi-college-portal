
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Send, Loader2, CalendarIcon, Info, ShieldAlert } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/config";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { User } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";

const admissionFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters." }).max(100),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  desiredProgram: z.string().min(1, { message: "Please select a program." }),
  statement: z.string().min(50, { message: "Statement must be at least 50 characters." }).max(1000),
  previousSchool: z.string().min(2, { message: "Previous school name is required."}).max(100),
  previousGrade: z.string().min(1, { message: "Previous grade/percentage is required."}).max(10),
});

type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

const programs = [
  { value: "computer_science", label: "B.Sc. Computer Science" },
  { value: "business_admin", label: "BBA Business Administration" },
  { value: "engineering_mech", label: "B.Eng. Mechanical Engineering" },
  { value: "arts_literature", label: "B.A. English Literature" },
  { value: "psychology", label: "B.Sc. Psychology" },
];

interface FormSettings {
  title: string;
  description: string;
  isActive: boolean;
}

export default function UserAdmissionFormPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [formSettings, setFormSettings] = React.useState<FormSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);

  const form = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      fullName: "",
      desiredProgram: "",
      statement: "",
      previousSchool: "",
      previousGrade: "",
    },
  });

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      setSettingsError(null);
      try {
        const response = await fetch("/api/admin/form-settings?formType=admission");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch form settings.");
        }
        const data = await response.json();
        setFormSettings(data.settings);
      } catch (error: any) {
        setSettingsError(error.message);
        toast({ title: "Error Loading Form Configuration", description: error.message, variant: "destructive" });
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  async function onSubmit(data: AdmissionFormValues) {
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

    console.log("Submitting admission form data:", data);

    try {
      const idToken = await currentUser.getIdToken();
      const response = await fetch("/api/forms/admission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...data,
          dateOfBirth: format(data.dateOfBirth, "yyyy-MM-dd"),
        }),
      });

      if (!response.ok) {
        let errorData = { error: { message: "Failed to submit admission form. Server returned an error." }};
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            try {
                const parsedError = await response.json();
                if (parsedError.error) {
                    if (typeof parsedError.error === 'string') {
                        errorData.error.message = parsedError.error;
                    } else if (typeof parsedError.error.message === 'string') {
                        errorData.error.message = parsedError.error.message;
                    }
                }
            } catch (e) {
                console.error("Admission form submission: Failed to parse JSON error response:", e);
                const errorText = await response.text();
                console.error("Admission form submission API raw error response text:", errorText);
                errorData.error.message = `Failed to submit. Server responded with status ${response.status}. Check server logs for details.`;
            }
        } else {
          const errorText = await response.text();
          console.error("Admission form submission API error response text:", errorText);
          errorData.error.message = `Failed to submit. Server responded with status ${response.status} and non-JSON content. Check server logs.`;
        }
        console.error("Admission form submission API error response:", errorData); 
        throw new Error(errorData.error.message);
      }

      const result = await response.json();
      console.log("Admission form submission successful:", result);
      toast({
        title: "Form Submitted",
        description: "Your admission form has been submitted successfully. Form ID: " + result.id,
      });
      form.reset();
    } catch (error: any) {
      console.error("Admission form submission error (client-side catch):", error);
       const clientErrorMessage = error.message || "An unexpected error occurred while submitting the form.";
      toast({
        title: "Submission Failed",
        description: clientErrorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingSettings) {
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
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
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
            <Link href="/user/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Admission Form</h1>
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

  if (!formSettings?.isActive) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings?.title || "Admission Form"}</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-6 w-6 text-primary"/>Form Currently Closed</CardTitle>
            <CardDescription>{formSettings?.description || "This form is not currently accepting submissions."}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please check back later or contact the administration for more information.</p>
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
            <Link href="/user/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings?.title || "Admission Form"}</h1>
        </div>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{formSettings?.title || "Apply for Admission"}</CardTitle>
              <CardDescription>
                {formSettings?.description || "Please fill out the details below to apply for admission to Sathi College."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your full name" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="desiredProgram"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Desired Program</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a program" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {programs.map((program) => (
                          <SelectItem key={program.value} value={program.value}>
                            {program.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="previousSchool"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., City High School" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="previousGrade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Grade / Percentage</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., 85% or A+" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statement of Purpose</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself and why you want to join this program (min. 50 characters)."
                        className="resize-y min-h-[100px]"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isSubmitting || !formSettings?.isActive}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
