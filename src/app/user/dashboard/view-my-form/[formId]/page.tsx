
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Printer, Trash2, CheckCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";
import { format, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
import { useRouter } from "next/navigation";
import Image from "next/image";

interface FormDetail {
  id: string;
  formType: string; 
  [key: string]: any; 
}

// Order of fields to display, others will be appended
const fieldOrder = [
  "formId", "userId", "userEmail", "submittedAt", "registeredAt", "uploadedAt", "status",
  "fullName", "dateOfBirth", "email", "phone", "address", "city", "state", "zipCode", "country",
  "desiredProgram", "previousSchool", "previousGrade", "statement",
  "studentName", "studentId", "term", "selectedCourses",
  // formData and details are handled specially
];

const formatDisplayValue = (key: string, value: any): string | React.ReactNode => {
  if (value === null || typeof value === 'undefined' || value === "") return <span className="italic text-muted-foreground">Not provided</span>;
  if (typeof value === 'boolean') return value ? "Yes" : "No";
  
  const dateKeys = ['submittedAt', 'registeredAt', 'uploadedAt', 'dateOfBirth', 'timestamp'];
  if (dateKeys.includes(key) || (typeof key === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().endsWith('at') || key.toLowerCase().includes('timestamp')))) {
      if (typeof value === 'string') {
          try {
              const dateFromISO = parseISO(value);
              if (!isNaN(dateFromISO.getTime())) return format(dateFromISO, "PP pp");
          } catch (e) { /* Fall through if not ISO */ }
          try {
              const dateFromGeneric = new Date(value);
              if (!isNaN(dateFromGeneric.getTime())) return format(dateFromGeneric, "PP pp");
          } catch (e) { /* Fall through if not generic date */ }
      } else if (value instanceof Date && !isNaN(value.getTime())) {
          return format(value, "PP pp");
      }
  }
  
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
    if (key === 'formData' || key === 'details') {
        return <span className="italic text-muted-foreground">[Details below]</span>;
    }
    try {
        // For other objects, pretty print JSON
        return <pre className="whitespace-pre-wrap text-xs bg-muted/50 p-2 rounded-sm">{JSON.stringify(value, null, 2)}</pre>;
    } catch {
        return "[Object]";
    }
  }
  return String(value);
};

const renderDetailItem = (label: string, value: any, isNested: boolean = false): React.ReactNode => {
  const prettyLabel = label
    .replace(/([A-Z])/g, ' $1') 
    .replace(/_/g, ' ')        
    .replace(/^./, (str) => str.toUpperCase()); 

  if ((label === 'formData' || label === 'details') && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return (
        <div key={label} className={cn("printable-data-item", isNested && "ml-4")}>
          <dt className="font-semibold text-sm text-foreground printable-data-label">{prettyLabel}:</dt>
          <dd className="ml-4 text-sm text-muted-foreground italic">No additional details provided.</dd>
        </div>
      );
    }
    return (
      <div key={label} className={cn("mb-3 printable-data-item", isNested && "ml-4")}>
        <dt className="font-semibold text-base text-foreground border-b pb-1 mb-2 printable-data-label">{prettyLabel}</dt>
        <dd className={cn("ml-0 mt-1 space-y-2", isNested && "nested-dl-print")}>
           <dl className="space-y-1">
            {entries.map(([subKey, subValue]) =>
              renderDetailItem(subKey, subValue, true) 
            )}
          </dl>
        </dd>
      </div>
    );
  }
  
  const itemClass = isNested ? "nested-dt-dd-pair" : "printable-data-item";

  return (
    <React.Fragment key={label}>
      <dt className={cn("sm:w-1/3 font-semibold text-sm text-foreground printable-data-label", isNested ? "nested-dt" : "pt-1")}>{prettyLabel}:</dt>
      <dd className={cn("sm:w-2/3 text-sm text-muted-foreground break-words", isNested ? "nested-dd" : "pt-1")}>{formatDisplayValue(label, value)}</dd>
    </React.Fragment>
  );
};


export default function ViewUserFormDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const formId = params.formId as string;
  const formTypeQueryParam = searchParams.get('type'); 

  const [formDetails, setFormDetails] = React.useState<FormDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);


  React.useEffect(() => {
    console.log("ViewUserFormDetailsPage: onAuthStateChanged effect setup.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("ViewUserFormDetailsPage: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (!user) { // If user becomes null (e.g., logged out), set loading to false and show error
        setIsLoading(false);
        setError("Authentication required to view form details.");
        setFormDetails(null);
      }
    });
    return () => {
      console.log("ViewUserFormDetailsPage: Cleaning up auth subscription.");
      unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const fetchFormDetails = async () => {
      // This guard is important. If these are missing, don't even try.
      if (!currentUser || !formId || !formTypeQueryParam) {
        console.log("ViewUserFormDetailsPage: fetchFormDetails - Pre-requisites not met. User:", currentUser?.uid, "FormId:", formId, "FormType:", formTypeQueryParam);
        if (!isLoading) { // Only update if not already in a loading state from a previous valid attempt
            setIsLoading(false);
            if (!currentUser) setError("Authentication required to view form details.");
            else setError("Form ID or Type missing in URL.");
        }
        return;
      }

      console.log(`ViewUserFormDetailsPage: fetchFormDetails - Attempting for formId: ${formId}, formType: ${formTypeQueryParam}, user: ${currentUser.uid}`);
      setIsLoading(true);
      setError(null);
      setFormDetails(null);

      try {
        console.log(`ViewUserFormDetailsPage: Attempting token refresh for ${currentUser.uid}`);
        const idToken = await currentUser.getIdToken(true);
        console.log(`ViewUserFormDetailsPage: Token refreshed. Fetching details...`);
        
        const response = await fetch(`/api/user/form-detail?id=${formId}&type=${encodeURIComponent(formTypeQueryParam)}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });

        console.log(`ViewUserFormDetailsPage: API response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse error response from server."}}));
          console.error("ViewUserFormDetailsPage: API error response data:", errorData);
          throw new Error(errorData.error?.message || `Failed to fetch form details. Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("ViewUserFormDetailsPage: API success response data:", data);
        if (data.form) {
          setFormDetails({ ...data.form, formType: formTypeQueryParam, id: formId });
        } else {
          throw new Error("Form data not found in API response.");
        }
      } catch (err: any) {
        console.error("ViewUserFormDetailsPage: Error during fetchFormDetails:", err);
        setError(err.message);
        toast({ title: "Error Loading Form", description: err.message, variant: "destructive" });
      } finally {
        console.log("ViewUserFormDetailsPage: fetchFormDetails finished, setting isLoading to false.");
        setIsLoading(false);
      }
    };

    // Only call fetch if we have the necessary data.
    if (currentUser && formId && formTypeQueryParam) {
        fetchFormDetails();
    } else if (!isLoading) { 
        // If not loading and essentials are still missing (e.g., after initial auth check)
        setIsLoading(false);
        if (!currentUser) setError("Authentication required.");
        else setError("Form ID or Type missing.");
    }
    // This effect should ONLY re-run if currentUser, formId, or formTypeQueryParam change.
  }, [currentUser, formId, formTypeQueryParam]);

  const handlePrint = () => {
    console.log("Print button clicked...");
    if (typeof window !== 'undefined' && window.print) {
        window.print();
    } else {
        console.warn("ViewUserFormDetailsPage: window.print is not available.");
        toast({
            title: "Print Not Available",
            description: "Printing is not available in this environment. Please try opening in a new tab or standard browser window.",
            variant: "default",
            duration: 7000,
        });
    }
  };

  const handleDeleteForm = async () => {
    if (!currentUser || !formDetails) {
      toast({ title: "Error", description: "Cannot delete form. User or form data missing.", variant: "destructive"});
      return;
    }
    setIsDeleting(true);
    try {
      const idToken = await currentUser.getIdToken(true);
      const response = await fetch('/api/user/delete-form', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ formId: formDetails.id, formType: formDetails.formType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete form.');
      }
      toast({ title: 'Form Deleted', description: `Your ${formDetails.formType} form has been successfully deleted.` });
      router.push('/user/dashboard/my-submitted-forms'); 
    } catch (error: any) {
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 no-print">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card className="shadow-lg max-w-3xl mx-auto no-print">
          <CardHeader>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4 py-10">
            <div className="flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading form details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/my-submitted-forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Card className="shadow-lg max-w-3xl mx-auto no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive"/>Form Details Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/my-submitted-forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Form Not Found</h1>
        </div>
        <Card className="shadow-lg max-w-3xl mx-auto no-print">
          <CardHeader>
            <CardTitle>Form details could not be loaded.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The requested form submission was not found or you do not have permission to view it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const orderedDetails = Object.entries(formDetails)
    .filter(([key]) => !['id', 'userId', 'userEmail', 'formType', 'submittedAt', 'registeredAt', 'uploadedAt', 'status', 'storagePath'].includes(key) && key !== 'formData' && key !== 'details')
    .sort(([keyA], [keyB]) => {
      const indexA = fieldOrder.indexOf(keyA);
      const indexB = fieldOrder.indexOf(keyB);
      if (indexA === -1 && indexB === -1) return keyA.localeCompare(keyB); 
      if (indexA === -1) return 1; 
      if (indexB === -1) return -1; 
      return indexA - indexB; 
    });

  const formDataObject = formDetails.formData || formDetails.details; // Prioritize formData for custom forms


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/my-submitted-forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formDetails.formType} Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4"/> Print
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete Form
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your {formDetails.formType.toLowerCase()} form submission.
                  The administration will be notified.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteForm} 
                  disabled={isDeleting}
                  className={cn(buttonVariants({variant: "destructive"}))}
                >
                   {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {/* Screen view (non-printable) */}
      <Card className="shadow-lg max-w-3xl mx-auto no-print">
         <CardHeader>
            <CardTitle>{formDetails.formType}</CardTitle>
            <CardDescription>
              Submitted on: {formatDisplayValue('submittedAt', formDetails.submittedAt || formDetails.registeredAt || formDetails.uploadedAt) || "N/A"}
              {formDetails.status && <><br/>Status: <span className={cn(
                  "font-semibold",
                  formDetails.status === "Approved" ? "text-green-600" :
                  formDetails.status === "Rejected" ? "text-red-600" :
                  "text-yellow-600"
                )}>{formDetails.status}</span></>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
              {orderedDetails.map(([key, value]) => renderDetailItem(key, value))}
              {formDataObject && typeof formDataObject === 'object' && Object.keys(formDataObject).length > 0 && (
                <div className="sm:col-span-3 mt-2"> {/* Ensure formData/details spans full width */}
                  {renderDetailItem(formDetails.formType === 'Custom Form' ? 'Custom Fields Data' : 'Additional Details', formDataObject)}
                </div>
              )}
            </dl>
          </CardContent>
      </Card>

      {/* Printable Area */}
      <div id="printable-area" className="print-only">
        <div className="printable-header">
           <Image src="https://icon2.cleanpng.com/20180627/vy/aayjnkno0.webp" alt="Amity University Logo" data-ai-hint="university logo" width={60} height={60} className="printable-logo" />
          <div className="printable-header-text">
            <h2>Amity University Madhya Pradesh</h2>
            <p>{formDetails.formType} Form Submission</p>
          </div>
        </div>

        <Card className="shadow-none border-none shadcn-card">
          <CardHeader>
            <CardTitle>{formDetails.formType}</CardTitle>
            <CardDescription>
              Submitted on: {formatDisplayValue('submittedAt', formDetails.submittedAt || formDetails.registeredAt || formDetails.uploadedAt) || "N/A"}
              {currentUser?.email && <><br/>Submitted by: {currentUser.email}</>}
              {formDetails.status && <><br/>Status: {formDetails.status}</>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              {orderedDetails.map(([key, value]) => renderDetailItem(key, value))}
              {formDataObject && typeof formDataObject === 'object' && Object.keys(formDataObject).length > 0 && (
                 renderDetailItem(formDetails.formType === 'Custom Form' ? 'Custom Fields Data' : 'Additional Details', formDataObject)
              )}
            </dl>
          </CardContent>
        </Card>
        
        <div className="printable-footer">
            <p>Contact: admissions@sathicollege.edu | Phone: +91-123-4567890</p>
            <p>Sathi College, Gwalior, Madhya Pradesh, India</p>
        </div>
      </div>
    </div>
  );
}
    

```
I've updated `/src/app/user/dashboard/view-my-form/[formId]/page.tsx`.

The main changes are:
1.  **Simplified `useEffect` for Data Fetching:** The `useEffect` hook that calls `fetchFormDetails` now only depends on `currentUser`, `formId`, and `formTypeQueryParam`. The `isLoading` state variable was removed from its dependency array, which is a common cause for such "stuck on loading" issues if not managed perfectly.
2.  **Initial Guard in `fetchFormDetails`:** The `fetchFormDetails` function now has a clearer guard clause at the beginning. If `currentUser`, `formId`, or `formTypeQueryParam` are missing, it will set an appropriate error and set `setIsLoading(false)` only if it wasn't already in a loading state (to avoid race conditions with the `finally` block).
3.  **Explicit `setIsLoading(false)` in `else if` block of `useEffect`:** If the primary `if (currentUser && formId && formTypeQueryParam)` condition isn't met *and* the component is not already loading, `setIsLoading(false)` is called, and an error is set. This ensures the loading state doesn't get stuck if, for example, the auth state resolves to `null` after an initial check.
4.  **Clearer Logging:** I've kept the detailed console logs to help trace when authentication is confirmed and when fetching starts and finishes.

**After this change, please:**
1.  **Restart your Next.js development server.**
2.  Open your browser's developer console.
3.  Log in and navigate to a submitted form's detail page.
4.  Observe the console logs. You should see messages indicating the auth state and the progression of `fetchFormDetails`. This will help confirm if `setIsLoading(false)` is being called appropriately.

This refined state management and effect dependency should make the loading behavior more predictable and prevent it from getting stuck. If the problem persists, the console logs will be essential for further diagnosis.Okay, the "stuck on loading" issue on the "View My Form Details" page (`/user/dashboard/view-my-form/[formId]/page.tsx`) often arises if the `isLoading` state is not correctly set to `false` in all possible scenarios (e.g., after an error, or if initial parameters are missing) or if the `useEffect` hook for data fetching has a dependency array that causes it to re-run unexpectedly.

I'll refine the `useEffect` hook that triggers `fetchFormDetails` and the state management within `fetchFormDetails` itself.

**Key Changes:**
1.  The `useEffect` hook that initiates `fetchFormDetails` will now *only* depend on `currentUser`, `formId`, and `formTypeQueryParam`. `isLoading` will be removed from its dependency array to prevent potential infinite loops if `setIsLoading(true)` is called within the effect.
2.  Inside `fetchFormDetails`, I'll ensure `setIsLoading(false)` is called in the `finally` block to cover both success and error cases of the actual fetch.
3.  I'll add a guard clause at the beginning of `fetchFormDetails` to do nothing if `currentUser`, `formId`, or `formTypeQueryParam` are missing, and ensure `setIsLoading(false)` is called in the outer `useEffect` if these prerequisites aren't met initially.

Here's the updated `src/app/user/dashboard/view-my-form/[formId]/page.tsx`:
<changes>
  <description>Refactor useEffect and loading state management in ViewUserFormDetailsPage to prevent it from getting stuck on loading. Ensure isLoading is set to false in all appropriate paths and remove it from the data fetching useEffect dependency array.</description>
  <change>
    <file>/src/app/user/dashboard/view-my-form/[formId]/page.tsx</file>
    <content><![CDATA[
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Printer, Trash2, CheckCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged, User } from "firebase/auth";
import { format, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
import { useRouter } from "next/navigation";
import Image from "next/image";

interface FormDetail {
  id: string;
  formType: string; 
  [key: string]: any; 
}

// Order of fields to display, others will be appended
const fieldOrder = [
  "formId", "userId", "userEmail", "submittedAt", "registeredAt", "uploadedAt", "status",
  "fullName", "dateOfBirth", "email", "phone", "address", "city", "state", "zipCode", "country",
  "desiredProgram", "previousSchool", "previousGrade", "statement",
  "studentName", "studentId", "term", "selectedCourses",
  // formData and details are handled specially
];

const formatDisplayValue = (key: string, value: any): string | React.ReactNode => {
  if (value === null || typeof value === 'undefined' || value === "") return <span className="italic text-muted-foreground">Not provided</span>;
  if (typeof value === 'boolean') return value ? "Yes" : "No";
  
  const dateKeys = ['submittedAt', 'registeredAt', 'uploadedAt', 'dateOfBirth', 'timestamp'];
  if (dateKeys.includes(key) || (typeof key === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().endsWith('at') || key.toLowerCase().includes('timestamp')))) {
      if (typeof value === 'string') {
          try {
              const dateFromISO = parseISO(value);
              if (!isNaN(dateFromISO.getTime())) return format(dateFromISO, "PP pp");
          } catch (e) { /* Fall through if not ISO */ }
          try {
              const dateFromGeneric = new Date(value);
              if (!isNaN(dateFromGeneric.getTime())) return format(dateFromGeneric, "PP pp");
          } catch (e) { /* Fall through if not generic date */ }
      } else if (value instanceof Date && !isNaN(value.getTime())) {
          return format(value, "PP pp");
      }
  }
  
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
    if (key === 'formData' || key === 'details') {
        return <span className="italic text-muted-foreground">[Details below]</span>;
    }
    try {
        return <pre className="whitespace-pre-wrap text-xs bg-muted/50 p-2 rounded-sm">{JSON.stringify(value, null, 2)}</pre>;
    } catch {
        return "[Object]";
    }
  }
  return String(value);
};

const renderDetailItem = (label: string, value: any, isNested: boolean = false): React.ReactNode => {
  const prettyLabel = label
    .replace(/([A-Z])/g, ' $1') 
    .replace(/_/g, ' ')        
    .replace(/^./, (str) => str.toUpperCase()); 

  if ((label === 'formData' || label === 'details') && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return (
        <div key={label} className={cn("printable-data-item", isNested && "ml-4")}>
          <dt className="font-semibold text-sm text-foreground printable-data-label">{prettyLabel}:</dt>
          <dd className="ml-4 text-sm text-muted-foreground italic">No additional details provided.</dd>
        </div>
      );
    }
    return (
      <div key={label} className={cn("mb-3 printable-data-item", isNested && "ml-4")}>
        <dt className="font-semibold text-base text-foreground border-b pb-1 mb-2 printable-data-label">{prettyLabel}</dt>
        <dd className={cn("ml-0 mt-1 space-y-2", isNested && "nested-dl-print")}>
           <dl className="space-y-1">
            {entries.map(([subKey, subValue]) =>
              renderDetailItem(subKey, subValue, true) 
            )}
          </dl>
        </dd>
      </div>
    );
  }
  
  return (
    <React.Fragment key={label}>
      <dt className={cn("sm:w-1/3 font-semibold text-sm text-foreground printable-data-label", isNested ? "nested-dt" : "pt-1")}>{prettyLabel}:</dt>
      <dd className={cn("sm:w-2/3 text-sm text-muted-foreground break-words", isNested ? "nested-dd" : "pt-1")}>{formatDisplayValue(label, value)}</dd>
    </React.Fragment>
  );
};


export default function ViewUserFormDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const formId = params.formId as string;
  const formTypeQueryParam = searchParams.get('type'); 

  const [formDetails, setFormDetails] = React.useState<FormDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true); // Start with loading true
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);


  React.useEffect(() => {
    console.log("ViewUserFormDetailsPage: onAuthStateChanged effect setup.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("ViewUserFormDetailsPage: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (!user) { // If user becomes null (e.g., logged out)
        setIsLoading(false); // Stop loading
        setError("Authentication required to view form details.");
        setFormDetails(null); // Clear any existing details
      }
    });
    return () => {
      console.log("ViewUserFormDetailsPage: Cleaning up auth subscription.");
      unsubscribe();
    };
  }, []); // This effect runs once to set up the auth listener

  React.useEffect(() => {
    const fetchFormDetails = async () => {
      // This guard is important. If these are missing, don't even try to fetch.
      if (!currentUser || !formId || !formTypeQueryParam) {
        console.log("ViewUserFormDetailsPage: fetchFormDetails - Pre-requisites not met for fetch. User:", currentUser?.uid, "FormId:", formId, "FormType:", formTypeQueryParam);
        // If we are not already in an explicit loading state from a previous valid attempt,
        // and prerequisites are missing, set loading to false and show error.
        if (!isLoading) { 
            setIsLoading(false);
            if (!currentUser) setError("Authentication required to view form details.");
            else setError("Form ID or Type missing in URL.");
        } else if (isLoading && (!currentUser || !formId || !formTypeQueryParam)) {
            // If we were loading, but now prerequisites are gone (e.g., user logged out), stop loading
            setIsLoading(false);
            if (!currentUser) setError("Authentication required to view form details.");
            else setError("Form ID or Type missing in URL.");
        }
        return;
      }

      console.log(`ViewUserFormDetailsPage: fetchFormDetails - Attempting for formId: ${formId}, formType: ${formTypeQueryParam}, user: ${currentUser.uid}`);
      setIsLoading(true); // Set loading true specifically for this fetch attempt
      setError(null);
      setFormDetails(null); 

      try {
        console.log(`ViewUserFormDetailsPage: Attempting token refresh for ${currentUser.uid}`);
        const idToken = await currentUser.getIdToken(true);
        console.log(`ViewUserFormDetailsPage: Token refreshed. Fetching details...`);
        
        const response = await fetch(`/api/user/form-detail?id=${formId}&type=${encodeURIComponent(formTypeQueryParam)}`, {
          headers: { 'Authorization': `Bearer ${idToken}` }
        });

        console.log(`ViewUserFormDetailsPage: API response status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: { message: "Failed to parse error response from server."}}));
          console.error("ViewUserFormDetailsPage: API error response data:", errorData);
          throw new Error(errorData.error?.message || `Failed to fetch form details. Status: ${response.status}`);
        }
        const data = await response.json();
        console.log("ViewUserFormDetailsPage: API success response data:", data);
        if (data.form) {
          setFormDetails({ ...data.form, formType: formTypeQueryParam, id: formId });
        } else {
          throw new Error("Form data not found in API response.");
        }
      } catch (err: any) {
        console.error("ViewUserFormDetailsPage: Error during fetchFormDetails:", err);
        setError(err.message);
        toast({ title: "Error Loading Form", description: err.message, variant: "destructive" });
      } finally {
        console.log("ViewUserFormDetailsPage: fetchFormDetails finished, setting isLoading to false.");
        setIsLoading(false);
      }
    };

    // Call fetchFormDetails only if currentUser, formId, and formTypeQueryParam are all available
    if (currentUser && formId && formTypeQueryParam) {
      fetchFormDetails();
    } else {
      // If essential data is missing after initial auth check, ensure loading stops.
      // This handles the initial page load where user might be null initially.
      if (!currentUser) {
          // No error set here as the auth useEffect will handle it if user stays null
          setIsLoading(false); 
      } else if (!formId || !formTypeQueryParam) {
          setError("Form ID or Type missing.");
          setIsLoading(false);
      }
    }
    // This effect should ONLY re-run if currentUser, formId, or formTypeQueryParam change.
  }, [currentUser, formId, formTypeQueryParam]); 

  const handlePrint = () => {
    console.log("ViewUserFormDetailsPage: Print button clicked...");
    if (typeof window !== 'undefined' && window.print) {
        window.print();
    } else {
        console.warn("ViewUserFormDetailsPage: window.print is not available.");
        toast({
            title: "Print Not Available",
            description: "Printing is not available in this environment. Please try opening in a new tab or standard browser window.",
            variant: "default",
            duration: 7000,
        });
    }
  };

  const handleDeleteForm = async () => {
    if (!currentUser || !formDetails) {
      toast({ title: "Error", description: "Cannot delete form. User or form data missing.", variant: "destructive"});
      return;
    }
    setIsDeleting(true);
    try {
      const idToken = await currentUser.getIdToken(true);
      const response = await fetch('/api/user/delete-form', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ formId: formDetails.id, formType: formDetails.formType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete form.');
      }
      toast({ title: 'Form Deleted', description: `Your ${formDetails.formType} form has been successfully deleted.` });
      router.push('/user/dashboard/my-submitted-forms'); 
    } catch (error: any) {
      toast({ title: 'Deletion Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 no-print">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card className="shadow-lg max-w-3xl mx-auto no-print">
          <CardHeader>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4 py-10">
            <div className="flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-3 text-muted-foreground">Loading form details...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/my-submitted-forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Card className="shadow-lg max-w-3xl mx-auto no-print">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-6 w-6 text-destructive"/>Form Details Unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!formDetails) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 no-print">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/my-submitted-forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Form Not Found</h1>
        </div>
        <Card className="shadow-lg max-w-3xl mx-auto no-print">
          <CardHeader>
            <CardTitle>Form details could not be loaded.</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">The requested form submission was not found or you do not have permission to view it.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const orderedDetails = Object.entries(formDetails)
    .filter(([key]) => !['id', 'userId', 'userEmail', 'formType', 'submittedAt', 'registeredAt', 'uploadedAt', 'status', 'storagePath'].includes(key) && key !== 'formData' && key !== 'details')
    .sort(([keyA], [keyB]) => {
      const indexA = fieldOrder.indexOf(keyA);
      const indexB = fieldOrder.indexOf(keyB);
      if (indexA === -1 && indexB === -1) return keyA.localeCompare(keyB); 
      if (indexA === -1) return 1; 
      if (indexB === -1) return -1; 
      return indexA - indexB; 
    });

  const formDataObject = formDetails.formData || formDetails.details; 


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/my-submitted-forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formDetails.formType} Details</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4"/> Print
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />}
                Delete Form
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your {formDetails.formType.toLowerCase()} form submission.
                  The administration will be notified.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteForm} 
                  disabled={isDeleting}
                  className={cn(buttonVariants({variant: "destructive"}))}
                >
                   {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      
      {/* Screen view (non-printable) */}
      <Card className="shadow-lg max-w-3xl mx-auto no-print">
         <CardHeader>
            <CardTitle>{formDetails.formType}</CardTitle>
            <CardDescription>
              Submitted on: {formatDisplayValue('submittedAt', formDetails.submittedAt || formDetails.registeredAt || formDetails.uploadedAt) || "N/A"}
              {formDetails.status && <><br/>Status: <span className={cn(
                  "font-semibold",
                  formDetails.status === "Approved" ? "text-green-600" :
                  formDetails.status === "Rejected" ? "text-red-600" :
                  "text-yellow-600"
                )}>{formDetails.status}</span></>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-3">
              {orderedDetails.map(([key, value]) => renderDetailItem(key, value))}
              {formDataObject && typeof formDataObject === 'object' && Object.keys(formDataObject).length > 0 && (
                <div className="sm:col-span-3 mt-2"> 
                  {renderDetailItem(formDetails.formType === 'Custom Form' ? 'Custom Fields Data' : 'Additional Details', formDataObject)}
                </div>
              )}
            </dl>
          </CardContent>
      </Card>

      {/* Printable Area */}
      <div id="printable-area" className="print-only">
        <div className="printable-header">
           <Image src="https://icon2.cleanpng.com/20180627/vy/aayjnkno0.webp" alt="Amity University Logo" data-ai-hint="university logo" width={60} height={60} className="printable-logo" />
          <div className="printable-header-text">
            <h2>Amity University Madhya Pradesh</h2>
            <p>{formDetails.formType} Form Submission</p>
          </div>
        </div>

        <Card className="shadow-none border-none shadcn-card">
          <CardHeader>
            <CardTitle>{formDetails.formType}</CardTitle>
            <CardDescription>
              Submitted on: {formatDisplayValue('submittedAt', formDetails.submittedAt || formDetails.registeredAt || formDetails.uploadedAt) || "N/A"}
              {currentUser?.email && <><br/>Submitted by: {currentUser.email}</>}
              {formDetails.status && <><br/>Status: {formDetails.status}</>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              {orderedDetails.map(([key, value]) => renderDetailItem(key, value))}
              {formDataObject && typeof formDataObject === 'object' && Object.keys(formDataObject).length > 0 && (
                 renderDetailItem(formDetails.formType === 'Custom Form' ? 'Custom Fields Data' : 'Additional Details', formDataObject)
              )}
            </dl>
          </CardContent>
        </Card>
        
        <div className="printable-footer">
            <p>Contact: admissions@sathicollege.edu | Phone: +91-123-4567890</p>
            <p>Sathi College, Gwalior, Madhya Pradesh, India</p>
        </div>
      </div>
    </div>
  );
}
    

