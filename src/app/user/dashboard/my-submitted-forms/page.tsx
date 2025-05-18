
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle, RefreshCw, ListChecks, FileText, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SubmittedForm {
  id: string;
  formType: 'Admission' | 'Course Registration' | 'Custom Form';
  submittedAt: Date | null;
  details?: string; 
  status?: string;
  formId?: string; // For custom forms
}

export default function MySubmittedFormsPage() {
  const [submittedForms, setSubmittedForms] = React.useState<SubmittedForm[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fetchSubmittedForms = async (user: User | null) => {
    console.log("MySubmittedFormsPage: fetchSubmittedForms called. User:", user ? user.uid : "null");
    if (!user) {
      setError("Please log in to view your submitted forms.");
      setIsLoading(false);
      setSubmittedForms([]);
      return;
    }
    if (!db) {
      console.error("MySubmittedFormsPage: Firestore 'db' instance is not available.");
      setError("Database connection error. Please try again later.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const forms: SubmittedForm[] = [];

      // Fetch Admission Forms
      console.log("MySubmittedFormsPage: Querying 'admissionForms' for user:", user.uid);
      const admissionFormsCollection = collection(db, "admissionForms");
      const admissionQuery = query(
        admissionFormsCollection,
        where("userId", "==", user.uid),
        orderBy("submittedAt", "desc")
      );
      const admissionSnapshot = await getDocs(admissionQuery);
      console.log(`MySubmittedFormsPage: Firestore query for admission forms executed. Found ${admissionSnapshot.docs.length} forms.`);
      admissionSnapshot.forEach((doc) => {
        const data = doc.data();
        forms.push({
          id: doc.id,
          formType: 'Admission',
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : (typeof data.submittedAt === 'string' ? new Date(data.submittedAt) : null),
          details: data.desiredProgram ? `Program: ${data.desiredProgram}` : `Full Name: ${data.fullName}`,
          status: data.status || "Submitted",
        });
      });

      // Fetch Course Registrations
      console.log("MySubmittedFormsPage: Querying 'courseRegistrations' for user:", user.uid);
      const courseRegCollection = collection(db, "courseRegistrations");
      const courseRegQuery = query(
        courseRegCollection,
        where("userId", "==", user.uid),
        orderBy("registeredAt", "desc") // Assuming 'registeredAt' field
      );
      const courseRegSnapshot = await getDocs(courseRegQuery);
      console.log(`MySubmittedFormsPage: Firestore query for course registrations executed. Found ${courseRegSnapshot.docs.length} forms.`);
      courseRegSnapshot.forEach((doc) => {
        const data = doc.data();
        const submittedTimestamp = data.registeredAt || data.submittedAt;
        forms.push({
          id: doc.id,
          formType: 'Course Registration',
          submittedAt: submittedTimestamp instanceof Timestamp ? submittedTimestamp.toDate() : (typeof submittedTimestamp === 'string' ? new Date(submittedTimestamp) : null),
          details: data.term ? `Term: ${data.term}, Courses: ${(data.selectedCourses || []).length}` : `Courses: ${(data.selectedCourses || []).length}`,
          status: data.status || "Submitted",
        });
      });

      // Fetch Custom Form Submissions
      console.log("MySubmittedFormsPage: Querying 'customFormSubmissions' for user:", user.uid);
      const customSubmissionsCollection = collection(db, "customFormSubmissions");
      const customQuery = query(
        customSubmissionsCollection,
        where("userId", "==", user.uid),
        orderBy("submittedAt", "desc")
      );
      const customSnapshot = await getDocs(customQuery);
      console.log(`MySubmittedFormsPage: Firestore query for custom form submissions executed. Found ${customSnapshot.docs.length} forms.`);
      customSnapshot.forEach((doc) => {
        const data = doc.data();
        forms.push({
          id: doc.id,
          formType: 'Custom Form',
          formId: data.formId, // Include specific formId if needed for details
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : (typeof data.submittedAt === 'string' ? new Date(data.submittedAt) : null),
          details: data.formId ? `Custom Form: ${data.formId}` : `Custom Submission`,
          status: data.status || "Submitted",
        });
      });
      
      forms.sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
      setSubmittedForms(forms);

    } catch (err: any) {
      console.error("MySubmittedFormsPage: Full error fetching submitted forms:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      const errorMessage = err.message ? `${err.message} (Code: ${err.code || 'N/A'})` : "Failed to load your submitted forms.";
      setError(errorMessage);
      toast({ title: "Error Loading Submitted Forms", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };
  
  React.useEffect(() => {
    console.log("MySubmittedFormsPage: useEffect for onAuthStateChanged mounting.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("MySubmittedFormsPage: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (user) {
        fetchSubmittedForms(user);
      } else {
        setSubmittedForms([]);
        setIsLoading(false);
        setError("Please log in to view your submitted forms.");
      }
    });
    return () => {
        console.log("MySubmittedFormsPage: useEffect for onAuthStateChanged unmounting.");
        unsubscribe();
    };
  }, []);

  const getFormTypeIcon = (formType: SubmittedForm['formType']) => {
    switch (formType) {
      case 'Admission':
        return <FileText className="h-5 w-5 text-blue-500" aria-label="Admission Form"/>;
      case 'Course Registration':
        return <BookMarked className="h-5 w-5 text-green-500" aria-label="Course Registration Form"/>;
      case 'Custom Form':
        return <ClipboardList className="h-5 w-5 text-purple-500" aria-label="Custom Form"/>;
      default:
        return <ListChecks className="h-5 w-5 text-muted-foreground" aria-label="Form"/>;
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">My Submitted Forms</h1>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchSubmittedForms(currentUser)} disabled={isLoading} aria-label="Refresh forms">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Submitted Form History</CardTitle>
          <CardDescription>
            View the status and details of all forms you have submitted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading your submitted forms...</p>
            </div>
          )}
          {error && !isLoading && (
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && submittedForms.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              You have not submitted any forms yet.
            </p>
          )}
          {!isLoading && !error && submittedForms.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Form Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Details</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submittedForms.map((form) => (
                    <TableRow key={form.id}>
                      <TableCell>
                        {getFormTypeIcon(form.formType)}
                      </TableCell>
                      <TableCell className="font-medium">{form.formType === 'Custom Form' && form.formId ? `${form.formType} (${form.formId})` : form.formType}</TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground truncate max-w-xs" title={form.details}>
                        {form.details || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {form.submittedAt ? format(form.submittedAt, "PP pp") : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap",
                          form.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                          form.status === "Rejected" ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" :
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" // Default to pending/submitted
                        )}>
                          {form.status || "Pending"}
                        </span>
                      </TableCell>
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
