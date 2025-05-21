
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
import { auth, app as firebaseApp, db } from "@/lib/firebase/config"; // Ensure db is imported if direct queries are ever re-enabled or for type info
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
  // originalData?: any; // Kept for potential future use (e.g., viewing full details)
}

const CUSTOM_FORM_ID = "mainGlobalCustomForm";

export default function MySubmittedFormsPage() {
  const [submittedForms, setSubmittedForms] = React.useState<SubmittedFormEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fetchSubmittedForms = React.useCallback(async (user: User | null) => {
    console.log("MySubmittedFormsPage: fetchSubmittedForms called. Current auth.currentUser:", auth.currentUser?.uid, "Firebase App name:", firebaseApp?.name);

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
      console.error("MySubmittedFormsPage: Firestore 'db' instance is not available for potential direct use (though API is primary).");
      // Not returning here as API calls are the primary method now.
    }

    setIsLoading(true);
    setError(null);
    let idToken = '';

    try {
      console.log(`MySubmittedFormsPage: Attempting to force token refresh for user: ${user.uid}`);
      idToken = await user.getIdToken(true); // Force refresh the ID token
      console.log(`MySubmittedFormsPage: Token refreshed successfully for user: ${user.uid}`);
    } catch (tokenError: any) {
      console.error(`MySubmittedFormsPage: Failed to refresh token for user ${user.uid}:`, JSON.stringify(tokenError, Object.getOwnPropertyNames(tokenError)));
      setError(`Authentication issue: Could not refresh session (Code: ${tokenError.code || 'UNKNOWN'}). Please try logging out and back in.`);
      setIsLoading(false);
      setSubmittedForms([]);
      return;
    }

    try {
      const allUserForms: SubmittedFormEntry[] = [];
      const apiEndpoints = [
        { path: "/api/user/my-admission-forms", type: "Admission" as const, summaryField: "desiredProgram", summaryPrefix: "Program: " },
        { path: "/api/user/my-course-registrations", type: "Course Registration" as const, summaryField: "term", summaryPrefix: "Term: ", coursesField: "selectedCourses" },
        { path: "/api/user/my-custom-submissions", type: "Custom Form" as const, summaryField: "formId", summaryPrefix: "Form ID: ", formDataField: "formData" },
      ];

      for (const endpoint of apiEndpoints) {
        console.log(`MySubmittedFormsPage: Fetching ${endpoint.type} forms from ${endpoint.path} for user: ${user.uid}...`);
        const response = await fetch(endpoint.path, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: `Failed to fetch ${endpoint.type} forms.` } }));
          console.error(`MySubmittedFormsPage: Error fetching ${endpoint.type} forms (API Response ${response.status}):`, errorData.error?.message || response.statusText);
          // Continue fetching other forms, but show an error for this type
          toast({ title: `Error Loading ${endpoint.type} Forms`, description: errorData.error?.message || `Server responded with ${response.status}`, variant: "destructive" });
          continue; // Skip to the next form type
        }

        const formsData = await response.json();
        (formsData as any[]).forEach((data: any) => {
          let detailsSummary = "N/A";
          if (endpoint.type === "Admission") {
            detailsSummary = `${endpoint.summaryPrefix}${data.desiredProgram || 'N/A'}`;
          } else if (endpoint.type === "Course Registration") {
            detailsSummary = `${endpoint.summaryPrefix}${data.term || 'N/A'}, Courses: ${(data.selectedCourses as string[] || []).length}`;
          } else if (endpoint.type === "Custom Form") {
            detailsSummary = `${endpoint.summaryPrefix}${data.formId || CUSTOM_FORM_ID}, Fields: ${data.formData ? Object.keys(data.formData).length : 0}`;
          }
          
          allUserForms.push({
            id: data.id,
            formType: endpoint.type,
            submittedAt: data.submittedAt || (endpoint.type === 'Course Registration' ? data.registeredAt : null), // Ensure ISO string
            detailsSummary: detailsSummary,
            status: data.status || "Submitted",
          });
        });
        console.log(`MySubmittedFormsPage: Fetched ${formsData.length} ${endpoint.type} forms.`);
      }

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
  
  if (isLoading || (!currentUser && auth.currentUser === null) ) { 
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
