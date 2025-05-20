
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle, RefreshCw, FileText, BookMarked, ClipboardList, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth, db, app as firebaseApp } from "@/lib/firebase/config";
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
  formId?: string; 
}

const CUSTOM_FORM_ID = "mainGlobalCustomForm";

export default function MySubmittedFormsPage() {
  const [submittedForms, setSubmittedForms] = React.useState<SubmittedForm[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fetchSubmittedForms = React.useCallback(async (user: User | null) => {
    console.log("MySubmittedFormsPage: fetchSubmittedForms called.");
    if (firebaseApp) {
      console.log("MySubmittedFormsPage: Firebase app name:", firebaseApp.name);
    } else {
      console.error("MySubmittedFormsPage: Firebase app (firebaseApp) is not initialized!");
    }
    if (db) {
        console.log("MySubmittedFormsPage: Firestore db instance is available.");
    } else {
        console.error("MySubmittedFormsPage: Firestore db instance is NOT available!");
    }
    console.log("MySubmittedFormsPage: Current auth.currentUser at fetch start:", auth.currentUser ? auth.currentUser.uid : "null");
    console.log("MySubmittedFormsPage: User object passed to fetchSubmittedForms:", user ? user.uid : "null");

    if (!user) {
      console.log("MySubmittedFormsPage: No user, setting error.");
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
      console.log(`MySubmittedFormsPage: Attempting to force token refresh for user: ${user.uid}`);
      await user.getIdToken(true); 
      console.log(`MySubmittedFormsPage: Token refreshed successfully for user: ${user.uid}. Current auth.currentUser: ${auth.currentUser?.uid}`);
    } catch (tokenError: any) {
      console.error(`MySubmittedFormsPage: Failed to refresh token for user ${user.uid}:`, JSON.stringify(tokenError, Object.getOwnPropertyNames(tokenError)));
      setError(`Authentication session issue: Could not refresh session (Code: ${tokenError.code || 'TOKEN_REFRESH_FAILED'}). Please try logging out and back in.`);
      setIsLoading(false);
      setSubmittedForms([]);
      return; 
    }

    const forms: SubmittedForm[] = [];
    const collectionsToFetch = [
      { name: "admissionForms", type: "Admission", dateField: "submittedAt" },
      { name: "courseRegistrations", type: "Course Registration", dateField: "registeredAt" },
      { name: "customFormSubmissions", type: "Custom Form", dateField: "submittedAt", formIdFilter: CUSTOM_FORM_ID },
    ] as const;

    try {
      for (const formConfig of collectionsToFetch) {
        console.log(`MySubmittedFormsPage: Querying '${formConfig.name}' for user: ${user.uid}`);
        const formCollection = collection(db, formConfig.name);
        
        let q;
        if (formConfig.name === "customFormSubmissions") {
          q = query(formCollection, where("userId", "==", user.uid), where("formId", "==", formConfig.formIdFilter), orderBy(formConfig.dateField, "desc"));
        } else {
          q = query(formCollection, where("userId", "==", user.uid), orderBy(formConfig.dateField, "desc"));
        }

        console.log(`MySubmittedFormsPage: Firestore query object created for ${formConfig.name}:`, q);
        const querySnapshot = await getDocs(q);
        console.log(`MySubmittedFormsPage: Firestore query for '${formConfig.name}' executed. Found ${querySnapshot.docs.length} forms.`);

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const submittedTimestamp = data[formConfig.dateField] || data.submittedAt; 
          let details = "N/A";
          if (formConfig.type === 'Admission') {
            details = data.desiredProgram ? `Program: ${data.desiredProgram}` : `Full Name: ${data.fullName}`;
          } else if (formConfig.type === 'Course Registration') {
            details = data.term ? `Term: ${data.term}, Courses: ${(data.selectedCourses || []).length}` : `Courses: ${(data.selectedCourses || []).length}`;
          } else if (formConfig.type === 'Custom Form') {
            const formDataEntries = Object.entries(data.formData || {}).slice(0, 2);
            details = formDataEntries.length > 0 
                        ? formDataEntries.map(([key, value]) => `${key}: ${String(value).substring(0,20)}...`).join('; ')
                        : 'Custom Submission';
          }

          forms.push({
            id: doc.id,
            formType: formConfig.type,
            submittedAt: submittedTimestamp instanceof Timestamp ? submittedTimestamp.toDate() : (typeof submittedTimestamp === 'string' ? new Date(submittedTimestamp) : null),
            details: details,
            status: data.status || "Submitted",
            formId: formConfig.type === 'Custom Form' ? data.formId : undefined,
          });
        });
      }
      
      forms.sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
      setSubmittedForms(forms);

    } catch (err: any) {
      console.error("MySubmittedFormsPage: Full error fetching submitted forms for UID", user.uid, ":", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      let errorMessage = err.message ? `${err.message} (Code: ${err.code || 'N/A'})` : "Failed to load your submitted forms.";
      if (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission-denied'))) {
        errorMessage = "Permission Denied: You may not have access to view these documents. Please check Firestore rules and ensure you are logged in. If querying ordered data, ensure composite indexes are created (check browser console for a link to create indexes).";
      }
      setError(errorMessage);
      toast({ title: "Error Loading Submitted Forms", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    console.log("MySubmittedFormsPage: useEffect for onAuthStateChanged mounting.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("MySubmittedFormsPage: Auth state changed. User UID:", user ? user.uid : 'null');
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
  }, [fetchSubmittedForms]);

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
        <Button variant="outline" size="icon" onClick={() => currentUser && fetchSubmittedForms(currentUser)} disabled={isLoading} aria-label="Refresh forms">
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
                    <TableHead className="w-[50px]">Icon</TableHead>
                    <TableHead>Form Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Summary</TableHead>
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
                      <TableCell className="font-medium">
                        {form.formType === 'Custom Form' && form.formId 
                          ? `Custom Form (${form.formId.replace("mainGlobalCustomForm", "General Inquiry")})` 
                          : form.formType}
                      </TableCell>
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
    
