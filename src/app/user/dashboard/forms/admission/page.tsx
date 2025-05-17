
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Send, Loader2, CalendarIcon, Info, ShieldCheck } from "lucide-react";
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
import { auth, db } from "@/lib/firebase/config";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
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

export default function UserAdmissionFormPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);
  const [formSettings, setFormSettings] = React.useState<{ isActive: boolean; title?: string; description?: string } | null>(null);
  const [isFormActive, setIsFormActive] = React.useState(false);


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
    const fetchFormSettings = async () => {
      try {
        const response = await fetch("/api/admin/form-settings?formType=admission");
        if (response.ok) {
          const data = await response.json();
          setFormSettings(data.settings);
          setIsFormActive(data.settings?.isActive || false);
        } else {
          setIsFormActive(false);
          toast({ title: "Error", description: "Could not load admission form settings.", variant: "destructive"});
        }
      } catch (error) {
        setIsFormActive(false);
        toast({ title: "Error", description: "Failed to fetch form settings.", variant: "destructive"});
      }
    };
    fetchFormSettings();
  }, []);


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user && db) {
        setIsLoadingStatus(true);
        const admissionFormsRef = collection(db, "admissionForms");
        const q = query(admissionFormsRef, where("userId", "==", user.uid), limit(1));
        try {
          const querySnapshot = await getDocs(q);
          setHasSubmitted(!querySnapshot.empty);
          if (!querySnapshot.empty) {
            toast({ title: "Form Already Submitted", description: "You have already submitted an admission application." });
          }
        } catch (error) {
          console.error("Error checking existing submission:", error);
          toast({ title: "Error", description: "Could not verify previous submissions.", variant: "destructive" });
        } finally {
          setIsLoadingStatus(false);
        }
      } else {
        setIsLoadingStatus(false);
        setHasSubmitted(false); // Reset if user logs out
      }
    });
    return () => unsubscribe();
  }, []);

  async function onSubmit(data: AdmissionFormValues) {
    if (hasSubmitted) {
      toast({ title: "Already Submitted", description: "You have already submitted this form.", variant: "info" });
      return;
    }
    if (!isFormActive) {
      toast({ title: "Form Closed", description: "The admission form is currently not active.", variant: "warning" });
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
        let errorData = { error: "Failed to submit admission form." };
        try {
          errorData = await response.json();
        } catch (e) {
          // Fallback if response is not JSON
          errorData.error = `Failed to submit admission form. Server responded with status ${response.status}.`;
        }
        throw new Error(errorData.error);
      }

      const result = await response.json();
      console.log("Admission form submission successful:", result);
      toast({
        title: "Form Submitted",
        description: "Your admission form has been submitted successfully. Form ID: " + result.id,
      });
      form.reset();
      setHasSubmitted(true); // Set hasSubmitted to true after successful submission
    } catch (error: any) {
      console.error("Admission form submission error (client-side catch):", error);
      toast({
        title: "Submission Failed",
        description: error.message || "An unexpected error occurred while submitting the form.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingStatus || formSettings === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader><Skeleton className="h-7 w-1/3 mb-1" /><Skeleton className="h-4 w-2/3" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-28 ml-auto" /></CardFooter>
        </Card>
      </div>
    );
  }

  if (!isFormActive) {
    return (
       <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formSettings?.title || "Admission Form"}</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-6 w-6 text-destructive"/>Form Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The {formSettings?.title?.toLowerCase() || "admission form"} is currently not accepting submissions. Please check back later.
            </p>
          </CardContent>
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
          <h1 className="text-3xl font-bold tracking-tight">Admission Form</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-green-500"/>Application Submitted</CardTitle>
            <CardDescription>You have already submitted your admission application.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you for applying. You can check the status of your application in the "My Activity" section of your dashboard.
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
            <Link href="/user/dashboard">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to User Dashboard</span>
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
              <Button type="submit" disabled={isSubmitting || hasSubmitted || !isFormActive}>
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

    