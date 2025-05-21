
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle, ListChecks, FileText, BookMarked, ClipboardList, Eye, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { auth, app as firebaseApp, db } from "@/lib/firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation"; // For navigation
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubmittedFormEntry {
  id: string;
  formType: 'Admission' | 'Course Registration' | 'Custom Form';
  submittedAt: string | null;
  detailsSummary: string;
  status?: string;
}

const CUSTOM_FORM_ID_FOR_SUMMARY = "mainGlobalCustomForm"; // Used for summary generation

export default function MySubmittedFormsPage() {
  const [submittedForms, setSubmittedForms] = React.useState<SubmittedFormEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null); // Tracks ID of form being deleted

  const fetchSubmittedForms = React.useCallback(async (user: User | null) => {
    console.log("MySubmittedFormsPage: fetchSubmittedForms called. Current auth.currentUser:", auth.currentUser?.uid, "Firebase App name:", firebaseApp?.name);
    if (!user) {
      setError("You must be logged in to view your submitted forms.");
      setIsLoading(false);
      setSubmittedForms([]);
      console.warn("MySubmittedFormsPage: No user found, cannot fetch forms.");
      return;
    }

    setIsLoading(true);
    setError(null);
    let idToken = '';
    try {
      console.log(`MySubmittedFormsPage: Attempting to force token refresh for user: ${user.uid}`);
      idToken = await user.getIdToken(true);
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
        { path: "/api/user/my-admission-forms", type: "Admission" as const, summaryKey: "desiredProgram", summaryPrefix: "Program: " },
        { path: "/api/user/my-course-registrations", type: "Course Registration" as const, summaryKey: "term", summaryPrefix: "Term: ", coursesKey: "selectedCourses" },
        { path: "/api/user/my-custom-submissions", type: "Custom Form" as const, summaryKey: "formId", summaryPrefix: "Form ID: ", formDataKey: "formData" },
      ];

      const results = await Promise.allSettled(
        apiEndpoints.map(endpoint =>
          fetch(endpoint.path, { headers: { 'Authorization': `Bearer ${idToken}` } })
            .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        )
      );

      results.forEach((result, index) => {
        const endpoint = apiEndpoints[index];
        if (result.status === 'fulfilled') {
          const formsData = result.value as any[];
          formsData.forEach((data: any) => {
            let detailsSummary = "N/A";
            if (endpoint.type === "Admission") {
              detailsSummary = `${endpoint.summaryPrefix}${data[endpoint.summaryKey] || 'N/A'}`;
            } else if (endpoint.type === "Course Registration") {
              detailsSummary = `${endpoint.summaryPrefix}${data[endpoint.summaryKey] || 'N/A'}, Courses: ${(data[endpoint.coursesKey as string] as string[] || []).length}`;
            } else if (endpoint.type === "Custom Form") {
              detailsSummary = `${endpoint.summaryPrefix}${data[endpoint.summaryKey] || CUSTOM_FORM_ID_FOR_SUMMARY}, Fields: ${data[endpoint.formDataKey as string] ? Object.keys(data[endpoint.formDataKey as string]).length : 0}`;
            }
            allUserForms.push({
              id: data.id,
              formType: endpoint.type,
              submittedAt: data.submittedAt || (endpoint.type === 'Course Registration' ? data.registeredAt : null),
              detailsSummary: detailsSummary,
              status: data.status || "Submitted",
            });
          });
          console.log(`MySubmittedFormsPage: Fetched ${formsData.length} ${endpoint.type} forms.`);
        } else {
          const errorData = result.reason;
          const errorMessage = errorData?.error?.message || `Failed to load ${endpoint.type} forms.`;
          console.error(`MySubmittedFormsPage: Error fetching ${endpoint.type} forms:`, errorMessage);
          toast({ title: `Error Loading ${endpoint.type}`, description: errorMessage, variant: "destructive" });
        }
      });

      allUserForms.sort((a, b) => {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        return dateB - dateA;
      });

      setSubmittedForms(allUserForms);
      console.log(`MySubmittedFormsPage: Total submitted forms processed for user ${user.uid}: ${allUserForms.length}`);
    } catch (err: any) {
      console.error("MySubmittedFormsPage: Full error processing submitted forms:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      const errorMessage = err.message ? `${err.message} (Code: ${err.code || 'N/A'})` : "Failed to load your submitted forms.";
      setError(errorMessage);
      toast({ title: "Error Loading Submitted Forms", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchSubmittedForms(user);
      } else {
        setError("Please log in to view your submitted forms.");
        setIsLoading(false);
        setSubmittedForms([]);
      }
    });
    return () => unsubscribe();
  }, [fetchSubmittedForms]);

  const handleDeleteForm = async (formId: string, formType: SubmittedFormEntry['formType']) => {
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to delete a form.", variant: "destructive"});
      return;
    }
    setIsDeleting(formId);
    try {
      const idToken = await currentUser.getIdToken(true);
      const response = await fetch('/api/user/delete-form', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ formId, formType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete form.');
      }
      toast({ title: 'Form Deleted', description: `${formType} form has been successfully deleted.` });
      fetchSubmittedForms(currentUser); // Refresh the list
    } catch (error: any) {
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(null);
    }
  };

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
  
  if (isLoading && (!currentUser && auth.currentUser === null)) { 
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
             <p className="ml-3 text-muted-foreground">Checking authentication and loading forms...</p>
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
            Here are all the forms you have submitted. You can view details or delete a submission.
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
              You haven&apos;t submitted any forms yet.
            </p>
          )}
          {!isLoading && !error && submittedForms.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Icon</TableHead>
                    <TableHead>Form Type</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="hidden sm:table-cell">Summary</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                    <TableHead className="text-right w-[130px]">Actions</TableHead>
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
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => router.push(`/user/dashboard/view-my-form/${form.id}?type=${encodeURIComponent(form.formType)}`)}
                          aria-label={`View details for ${form.formType} form submitted on ${form.submittedAt ? format(new Date(form.submittedAt), "PP") : 'N/A'}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" className="h-8 w-8" disabled={isDeleting === form.id}>
                              {isDeleting === form.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4" />}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your {form.formType.toLowerCase()} form submission.
                                The administration will be notified of this deletion.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={isDeleting === form.id}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteForm(form.id, form.formType)}
                                disabled={isDeleting === form.id}
                                className={buttonVariants({variant: "destructive"})}
                              >
                                {isDeleting === form.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
