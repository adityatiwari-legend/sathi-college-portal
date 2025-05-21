
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle, ListChecks, FileText, BookMarked, ClipboardList, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { auth, db, app as firebaseApp } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface SubmittedFormEntry {
  id: string;
  formType: 'Admission' | 'Course Registration' | 'Custom Form';
  submittedAt: string | null; // ISO string
  detailsSummary: string;
  status?: string;
  originalData?: any; // To pass to a detail view if needed
}

export default function MySubmittedFormsPage() {
  const [submittedForms, setSubmittedForms] = React.useState<SubmittedFormEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fetchSubmittedForms = React.useCallback(async (user: User | null) => {
    console.log("MySubmittedFormsPage: fetchSubmittedForms called. CurrentUser from auth state:", user?.uid);
    console.log("MySubmittedFormsPage: Firebase app name:", firebaseApp?.name);
    console.log("MySubmittedFormsPage: Firestore db instance defined:", !!db);

    if (!user) {
      setError("You must be logged in to view your submitted forms.");
      setIsLoading(false);
      setSubmittedForms([]);
      console.warn("MySubmittedFormsPage: No user found, cannot fetch forms.");
      return;
    }
     if (!db) {
      setError("Database service is not available. Please try again later.");
      setIsLoading(false);
      setSubmittedForms([]);
      console.error("MySubmittedFormsPage: Firestore 'db' instance is not available!");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`MySubmittedFormsPage: Attempting to force token refresh for user: ${user.uid}`);
      await user.getIdToken(true); // Force refresh the ID token
      console.log(`MySubmittedFormsPage: Token refreshed successfully for user: ${user.uid}`);

      const allUserForms: SubmittedFormEntry[] = [];

      // Fetch Admission Forms
      console.log(`MySubmittedFormsPage: Querying 'admissionForms' for user: ${user.uid}...`);
      const admissionQuery = query(
        collection(db, "admissionForms"),
        where("userId", "==", user.uid),
        orderBy("submittedAt", "desc")
      );
      const admissionSnapshot = await getDocs(admissionQuery);
      admissionSnapshot.forEach((doc) => {
        const data = doc.data();
        allUserForms.push({
          id: doc.id,
          formType: "Admission",
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate().toISOString() : (typeof data.submittedAt === 'string' ? data.submittedAt : null),
          detailsSummary: `Program: ${data.desiredProgram || 'N/A'}`,
          status: data.status || "Submitted",
          originalData: data,
        });
      });
      console.log(`MySubmittedFormsPage: Found ${admissionSnapshot.size} admission forms.`);

      // Fetch Course Registrations
      console.log(`MySubmittedFormsPage: Querying 'courseRegistrations' for user: ${user.uid}...`);
      const courseRegQuery = query(
        collection(db, "courseRegistrations"),
        where("userId", "==", user.uid),
        orderBy("registeredAt", "desc") // Assuming 'registeredAt' is the submission timestamp
      );
      const courseRegSnapshot = await getDocs(courseRegQuery);
      courseRegSnapshot.forEach((doc) => {
        const data = doc.data();
        const submittedTimestamp = data.registeredAt || data.submittedAt;
        allUserForms.push({
          id: doc.id,
          formType: "Course Registration",
          submittedAt: submittedTimestamp instanceof Timestamp ? submittedTimestamp.toDate().toISOString() : (typeof submittedTimestamp === 'string' ? submittedTimestamp : null),
          detailsSummary: `Term: ${data.term || 'N/A'}, Courses: ${(data.selectedCourses as string[] || []).length}`,
          status: data.status || "Submitted",
          originalData: data,
        });
      });
      console.log(`MySubmittedFormsPage: Found ${courseRegSnapshot.size} course registration forms.`);

      // Fetch Custom Form Submissions
      console.log(`MySubmittedFormsPage: Querying 'customFormSubmissions' for user: ${user.uid}...`);
      const customFormQuery = query(
        collection(db, "customFormSubmissions"),
        where("userId", "==", user.uid),
        orderBy("submittedAt", "desc")
      );
      const customFormSnapshot = await getDocs(customFormQuery);
      customFormSnapshot.forEach((doc) => {
        const data = doc.data();
        allUserForms.push({
          id: doc.id,
          formType: "Custom Form",
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate().toISOString() : (typeof data.submittedAt === 'string' ? data.submittedAt : null),
          detailsSummary: `Form ID: ${data.formId || 'N/A'}, Fields: ${data.formData ? Object.keys(data.formData).length : 0}`,
          status: data.status || "Submitted",
          originalData: data,
        });
      });
      console.log(`MySubmittedFormsPage: Found ${customFormSnapshot.size} custom forms.`);


      // Sort all combined forms by date (newest first)
      allUserForms.sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });

      setSubmittedForms(allUserForms);
      console.log(`MySubmittedFormsPage: Total submitted forms fetched for user ${user.uid}: ${allUserForms.length}`);
    } catch (err: any) {
      console.error("MySubmittedFormsPage: Full error fetching submitted forms:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      const errorMessage = err.message ? `${err.message} (Code: ${err.code || 'N/A'})` : "Failed to load your submitted forms.";
      setError(errorMessage);
      toast({ title: "Error Loading Submitted Forms", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    console.log("MySubmittedFormsPage: onAuthStateChanged effect setup.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("MySubmittedFormsPage: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (user) {
        fetchSubmittedForms(user);
      } else {
        setError("Please log in to view your submitted forms.");
        setIsLoading(false);
        setSubmittedForms([]);
      }
    });
    return () => {
      console.log("MySubmittedFormsPage: Cleaning up onAuthStateChanged subscription.");
      unsubscribe();
    };
  }, [fetchSubmittedForms]);

  const getFormTypeIcon = (formType: SubmittedFormEntry['formType']) => {
    switch (formType) {
      case 'Admission':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'Course Registration':
        return <BookMarked className="h-5 w-5 text-green-500" />;
      case 'Custom Form':
        return <ClipboardList className="h-5 w-5 text-purple-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };
  
  if (isLoading || !currentUser && auth.currentUser === null ) { // Show loader if still checking auth or fetching
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-7 w-1/3 mb-1" />
            <Skeleton className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="flex items-center justify-center py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
             <p className="ml-3 text-muted-foreground">Loading your submitted forms...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/user/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">My Submitted Forms</h1>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Submissions</CardTitle>
          <CardDescription>
            Here are all the forms you have submitted to Sathi College Portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && submittedForms.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              You haven&apos;t submitted any forms yet.
            </p>
          )}
          {!isLoading && !error && submittedForms.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Form Type</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="hidden sm:table-cell">Summary</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    {/* <TableHead className="text-right w-[80px]">View</TableHead> */}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submittedForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>{getFormTypeIcon(form.formType)}</TableCell>
                      <TableCell className="font-medium">{form.formType}</TableCell>
                      <TableCell>
                        {form.submittedAt ? format(new Date(form.submittedAt), "PP pp") : 'N/A'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-xs truncate" title={form.detailsSummary}>
                        {form.detailsSummary}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap",
                          form.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                          form.status === "Rejected" ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" :
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                        )}>
                          {form.status || "Pending"}
                        </span>
                      </TableCell>
                      {/* Placeholder for view button - link to a dynamic route like /user/dashboard/my-submissions/[formId]?type=[formType]
                      <TableCell className="text-right">
                        <Button variant="outline" size="icon" className="h-8 w-8" asChild>
                          <Link href={`/user/dashboard/my-submissions/${form.id}?type=${encodeURIComponent(form.formType)}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                      */}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
    