
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Printer, Trash2, FileText, BookOpen, ClipboardList, CheckCircle } from "lucide-react";
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
  formType: string; // This will be 'Admission', 'Course Registration', or 'Custom Form'
  [key: string]: any; // For dynamic fields
}

// Order for displaying top-level fields. Others will be appended.
const fieldOrder = [
  "formId", "userId", "userEmail", "submittedAt", "registeredAt", "uploadedAt", "status",
  // Admission Form Specific
  "fullName", "dateOfBirth", "email", "phone", "address", "city", "state", "zipCode", "country",
  "desiredProgram", "previousSchool", "previousGrade", "statement",
  // Course Registration Specific
  "studentName", "studentId", "term", "selectedCourses",
  // Custom Form Data container
  "formData",
  // General details container
  "details" 
];

// Helper function to format values for display
const formatDisplayValue = (key: string, value: any): string | React.ReactNode => {
  if (value === null || typeof value === 'undefined') return <span className="italic text-muted-foreground">Not provided</span>;
  if (typeof value === 'boolean') return value ? "Yes" : "No";
  
  // Attempt to parse and format if it's a known date key or a valid date string/object
  if ((key.toLowerCase().includes('date') || 
       key.toLowerCase().endsWith('at') || 
       key.toLowerCase().endsWith('dob')) && 
      (typeof value === 'string' || value instanceof Date)) {
    try {
      const dateObj = typeof value === 'string' ? parseISO(value) : value;
      if (dateObj && !isNaN(dateObj.getTime())) {
        return format(dateObj, "PP pp"); 
      }
    } catch (e) { /* Not a parsable ISO string, fall through */ }
  }
  // Fallback for non-ISO date strings that JS can parse
  if (typeof value === 'string' && (key.toLowerCase().includes('date') || key.toLowerCase().endsWith('at'))) {
    try {
      const dateFromGeneric = new Date(value);
      if (!isNaN(dateFromGeneric.getTime())) {
        return format(dateFromGeneric, "PP pp");
      }
    } catch (e) { /* Still not a valid date string, fall through */ }
  }
  
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
    // For 'formData' or 'details' objects, we handle them in renderDetailItem to create nested lists
    if (key === 'formData' || key === 'details') {
        return <span className="italic text-muted-foreground">[Details below]</span>;
    }
    return JSON.stringify(value, null, 2); // Fallback for other objects
  }
  return String(value);
};

// Recursive function to render form details
const renderDetailItem = (label: string, value: any, indentLevel = 0): React.ReactNode => {
  const prettyLabel = label
    .replace(/([A-Z])/g, ' $1') 
    .replace(/_/g, ' ')        
    .replace(/^./, (str) => str.toUpperCase()); 

  // Handle nested objects like formData or details by creating a sub-list
  if ((label === 'formData' || label === 'details') && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return (
        <div key={label} className={cn("printable-data-item", indentLevel > 0 ? `ml-${indentLevel * 4}` : 'ml-0')}>
          <dt className="font-semibold text-sm text-foreground printable-data-label">{prettyLabel}:</dt>
          <dd className="ml-4 text-sm text-muted-foreground italic">No additional details provided.</dd>
        </div>
      );
    }
    return (
      <div key={label} className={cn(`mb-3 printable-data-item`, indentLevel > 0 && `ml-${indentLevel * 4}`)}>
        <dt className="font-semibold text-base text-foreground border-b pb-1 mb-2 printable-data-label">{prettyLabel}</dt>
        <dd className={`ml-0 mt-1 space-y-2`}>
          <dl className="space-y-1 ml-4 pl-4 border-l border-muted nested-dl-print">
            {entries.map(([subKey, subValue]) =>
              renderDetailItem(subKey, subValue, indentLevel + 1) 
            )}
          </dl>
        </dd>
      </div>
    );
  }

  // Handle arrays specifically, could be course lists etc.
  if (Array.isArray(value)) {
    return (
      <div key={label} className={cn(`printable-data-item`, indentLevel > 0 ? `ml-${indentLevel * 4}` : 'ml-0')}>
        <dt className="font-semibold text-sm text-foreground printable-data-label">{prettyLabel}:</dt>
        <dd className="ml-4 text-sm text-muted-foreground">
          {value.length > 0 ? (
            <ul className="list-disc list-inside">
              {value.map((item, index) => <li key={index}>{formatDisplayValue(subKeyFromArrayItem(item, index) , item)}</li>)}
            </ul>
          ) : (
            <span className="italic">None</span>
          )}
        </dd>
      </div>
    );
  }
  // Helper to create a pseudo-key for array item formatting, not strictly necessary if formatDisplayValue doesn't rely on key for arrays
  const subKeyFromArrayItem = (item: any, index: number) => `item_${index}`;


  return (
    <div key={label} className={cn(`printable-data-item`, indentLevel > 0 ? `ml-${indentLevel * 4}` : 'ml-0')}>
      <dt className="font-semibold text-sm text-foreground printable-data-label">{prettyLabel}:</dt>
      <dd className="ml-4 text-sm text-muted-foreground break-words">{formatDisplayValue(label, value)}</dd>
    </div>
  );
};


export default function ViewUserFormDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const formId = params.formId as string;
  const formTypeQueryParam = searchParams.get('type'); // Can be null

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
      // Fetching will now be triggered by the useEffect below that depends on currentUser, formId, formTypeQueryParam
    });
    return () => {
      console.log("ViewUserFormDetailsPage: Cleaning up auth subscription.");
      unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const fetchFormDetails = async () => {
      if (!currentUser || !formId || !formTypeQueryParam) {
        console.log("ViewUserFormDetailsPage: Skipping fetch, missing user, formId, or formType. User:", currentUser?.uid, "FormId:", formId, "FormType:", formTypeQueryParam);
        if (!currentUser && !isLoading) setError("Authentication required to view form details.");
        if ((!formId || !formTypeQueryParam) && !isLoading) setError("Form ID or Type missing in URL.");
        setIsLoading(false); // Ensure loading stops if params are missing after auth check
        return;
      }

      console.log(`ViewUserFormDetailsPage: Attempting to fetch form details for formId: ${formId}, formType: ${formTypeQueryParam}, user: ${currentUser.uid}`);
      setIsLoading(true);
      setError(null);
      setFormDetails(null);

      try {
        const idToken = await currentUser.getIdToken(true);
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

    if (currentUser && formId && formTypeQueryParam) {
      fetchFormDetails();
    } else if (!isLoading && (!currentUser || !formId || !formTypeQueryParam)) {
      // If not loading and any crucial param is missing (after initial auth check)
      setIsLoading(false);
      if (!currentUser) setError("Authentication required.");
      else setError("Form ID or Type missing in URL.");
    }
  }, [currentUser, formId, formTypeQueryParam]); // Removed isLoading from dependency array

  const handlePrint = () => {
    console.log("ViewUserFormDetailsPage: Print button clicked...");
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    } else {
      console.warn("ViewUserFormDetailsPage: window.print is not available. This might be due to a sandboxed environment.");
      toast({
        title: "Print Not Available",
        description: "Printing is not available in this environment. Please try opening the page in a new tab or standard browser window if you are in an embedded view.",
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
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-10">
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
    .filter(([key]) => !['id', 'formType', 'userId', 'userEmail'].includes(key)) 
    .sort(([keyA], [keyB]) => {
      const indexA = fieldOrder.indexOf(keyA);
      const indexB = fieldOrder.indexOf(keyB);
      if (indexA === -1 && indexB === -1) return keyA.localeCompare(keyB); 
      if (indexA === -1) return 1; 
      if (indexB === -1) return -1; 
      return indexA - indexB; 
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/my-submitted-forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">{formDetails.formType} Form Details</h1>
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

      <div id="printable-area" className="print-only">
        <div className="printable-header">
           <Image src="https://icon2.cleanpng.com/20180627/vy/aayjnkno0.webp" alt="Amity University Logo" data-ai-hint="university logo" width={60} height={60} className="printable-logo" />
          <div className="printable-header-text">
            <h2>Amity University Madhya Pradesh</h2>
            <p>{formDetails.formType} Form Submission</p>
          </div>
        </div>

        <Card className="shadow-lg max-w-3xl mx-auto my-6 shadcn-card">
          <CardHeader>
            <CardTitle>{formDetails.formType} - Reference ID: {formDetails.id}</CardTitle>
            <CardDescription>
              Submitted on: {formDetails.submittedAt ? formatDisplayValue('submittedAt', formDetails.submittedAt) : "N/A"}
              <br/>
              User ID: {formDetails.userId || "N/A"}
              {formDetails.userEmail && <><br/>User Email: {formDetails.userEmail}</>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {orderedDetails.map(([key, value]) => renderDetailItem(key, value))}
            </dl>
          </CardContent>
        </Card>
        
        <div className="printable-footer">
            <p>Contact: admissions@sathicollege.edu | Phone: +91-123-4567890</p>
            <p>Sathi College, Gwalior, Madhya Pradesh, India</p>
        </div>
      </div>

       {/* Screen view (non-printable) */}
      <Card className="shadow-lg max-w-3xl mx-auto no-print">
         <CardHeader>
            <CardTitle>{formDetails.formType} - Reference ID: {formDetails.id}</CardTitle>
            <CardDescription>
              Submitted on: {formDetails.submittedAt ? formatDisplayValue('submittedAt', formDetails.submittedAt) : "N/A"}
              <br/>
              User ID: {formDetails.userId || "N/A"}
              {formDetails.userEmail && <><br/>User Email: {formDetails.userEmail}</>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {orderedDetails.map(([key, value]) => renderDetailItem(key, value))}
            </dl>
          </CardContent>
      </Card>
    </div>
  );
}
    
