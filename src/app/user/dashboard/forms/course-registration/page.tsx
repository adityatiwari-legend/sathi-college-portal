
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Send, Loader2, BookMarked, Info, ShieldCheck } from "lucide-react";
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
  FormDescription as ShadFormDescription, // Renamed to avoid conflict
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
import { auth, db } from "@/lib/firebase/config";
import { User, onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
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

export default function UserCourseRegistrationFormPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = React.useState(true);
  const [formSettings, setFormSettings] = React.useState<{ isActive: boolean; title?: string; description?: string } | null>(null);
  const [isFormActive, setIsFormActive] = React.useState(false);
  
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
    const fetchFormSettings = async () => {
      try {
        const response = await fetch("/api/admin/form-settings?formType=courseRegistration");
        if (response.ok) {
          const data = await response.json();
          setFormSettings(data.settings);
          setIsFormActive(data.settings?.isActive || false);
        } else {
          setIsFormActive(false);
          toast({ title: "Error", description: "Could not load course registration form settings.", variant: "destructive"});
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
      if (user) {
        form.setValue("studentName", user.displayName || "");
        if (db) {
          setIsLoadingStatus(true);
          const courseRegRef = collection(db, "courseRegistrations");
          // Check if a registration for the current term exists (or any for simplicity if terms aren't strictly enforced yet)
          const q = query(courseRegRef, where("userId", "==", user.uid), limit(1)); // Example: limit to 1 for any term
          try {
            const querySnapshot = await getDocs(q);
            setHasSubmitted(!querySnapshot.empty);
            if (!querySnapshot.empty) {
               toast({ title: "Form Already Submitted", description: "You have already submitted a course registration form." });
            }
          } catch (error) {
            console.error("Error checking existing course registration:", error);
            toast({ title: "Error", description: "Could not verify previous submissions.", variant: "destructive" });
          } finally {
            setIsLoadingStatus(false);
          }
        } else {
           setIsLoadingStatus(false);
        }
      } else {
        setIsLoadingStatus(false);
        setHasSubmitted(false);
      }
    });
    return () => unsubscribe();
  }, [form]);


  async function onSubmit(data: CourseRegistrationFormValues) {
     if (hasSubmitted) {
      toast({ title: "Already Submitted", description: "You have already submitted this form.", variant: "info" });
      return;
    }
    if (!isFormActive) {
      toast({ title: "Form Closed", description: "The course registration form is currently not active.", variant: "warning" });
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
        let errorData = { error: { message: "Failed to submit course registration." } };
         try {
          errorData = await response.json();
        } catch (e) {
           errorData.error.message = `Failed to submit. Server responded with status ${response.status}.`;
        }
        throw new Error(errorData.error.message);
      }

      toast({
        title: "Registration Submitted",
        description: "Your course registration has been submitted successfully.",
      });
      form.reset();
      setHasSubmitted(true); // Set hasSubmitted to true after successful submission
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
  
  if (isLoadingStatus || formSettings === null) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader><Skeleton className="h-7 w-1/3 mb-1" /><Skeleton className="h-4 w-2/3" /></CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            <Skeleton className="h-20 w-full" />
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
          <h1 className="text-3xl font-bold tracking-tight">{formSettings?.title || "Course Registration"}</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Info className="h-6 w-6 text-destructive"/>Form Closed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The {formSettings?.title?.toLowerCase() || "course registration form"} is currently not accepting submissions. Please check back later.
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
          <h1 className="text-3xl font-bold tracking-tight">Course Registration</h1>
        </div>
        <Card className="shadow-lg max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-6 w-6 text-green-500"/>Registration Submitted</CardTitle>
            <CardDescription>You have already submitted your course registration for the current period.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You can view your submitted registrations in the "My Activity" section.
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
                     <ShadFormDescription>
                      This is pre-filled from your profile if available.
                    </ShadFormDescription>
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
                      <ShadFormDescription>
                        Select the courses you wish to register for.
                      </ShadFormDescription>
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
              <Button type="submit" disabled={isSubmitting || hasSubmitted || !isFormActive}>
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

    