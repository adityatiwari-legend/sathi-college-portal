
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Send, Loader2, BookMarked, Info, ShieldAlert } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/config";
import { User } from "firebase/auth";
import { Skeleton } from "@/components/ui/skeleton";

const courseRegistrationFormSchema = z.object({
  studentName: z.string().min(1, {message: "Student name is required (auto-filled if available)"}).optional(),
  studentId: z.string().min(5, { message: "Student ID must be at least 5 characters." }).max(20),
  term: z.string().min(1, { message: "Please select a term." }),
  selectedCourses: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one course.",
  }),
});

type CourseRegistrationFormValues = z.infer<typeof courseRegistrationFormSchema>;

const terms = [
  { value: "fall_2024", label: "Fall 2024" },
  { value: "spring_2025", label: "Spring 2025" },
  { value: "summer_2025", label: "Summer 2025" },
];

const allCourses = [
  { id: "cs101", label: "Introduction to Computer Science" },
  { id: "ma201", label: "Calculus II" },
  { id: "ph100", label: "Philosophy of Mind" },
  { id: "en250", label: "Advanced Creative Writing" },
  { id: "hi303", label: "Modern World History" },
  { id: "ec101", label: "Principles of Microeconomics" },
];

interface FormSettings {
  title: string;
  description: string;
  isActive: boolean;
}

export default function UserCourseRegistrationFormPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [formSettings, setFormSettings] = React.useState<FormSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [settingsError, setSettingsError] = React.useState<string | null>(null);
  
  const form = useForm<CourseRegistrationFormValues>({
    resolver: zodResolver(courseRegistrationFormSchema),
    defaultValues: {
      studentName: "",
      studentId: "",
      term: "",
      selectedCourses: [],
    },
  });
  
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser(user);
        form.setValue("studentName", user.displayName || "");
      } else {
        setCurrentUser(null);
      }
    });
    return () => unsubscribe();
  }, [form]);

  React.useEffect(() => {
    const fetchSettings = async () => {
      setIsLoadingSettings(true);
      setSettingsError(null);
      try {
        const response = await fetch("/api/admin/form-settings?formType=course-registration");
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

  async function onSubmit(data: CourseRegistrationFormValues) {
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
      const response = await fetch("/api/forms/course-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...data,
          studentName: data.studentName || currentUser.displayName || "N/A",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to submit course registration.");
      }

      toast({
        title: "Registration Submitted",
        description: "Your course registration has been submitted successfully.",
      });
      form.reset();
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
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            <Skeleton className="h-20 w-full" /> 
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
          <h1 className="text-3xl font-bold tracking-tight">Course Registration</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">{formSettings?.title || "Course Registration"}</h1>
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
          <h1 className="text-3xl font-bold tracking-tight">{formSettings?.title || "Course Registration"}</h1>
        </div>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>{formSettings?.title || "Register for Courses"}</CardTitle>
              <CardDescription>
                {formSettings?.description || "Select your courses for the upcoming term."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
               <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} disabled={isSubmitting || !!currentUser?.displayName} />
                    </FormControl>
                     <FormDescription>
                      This is pre-filled from your profile if available.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your student ID" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="term"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Term</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a term/semester" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {terms.map((term) => (
                          <SelectItem key={term.value} value={term.value}>
                            {term.label}
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
                name="selectedCourses"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Available Courses</FormLabel>
                      <FormDescription>
                        Select the courses you wish to register for.
                      </FormDescription>
                    </div>
                    {allCourses.map((course) => (
                      <FormField
                        key={course.id}
                        control={form.control}
                        name="selectedCourses"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={course.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(course.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), course.id])
                                      : field.onChange(
                                          (field.value || []).filter(
                                            (value) => value !== course.id
                                          )
                                        )
                                  }}
                                  disabled={isSubmitting}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {course.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
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
                  <BookMarked className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Registering..." : "Submit Registration"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
