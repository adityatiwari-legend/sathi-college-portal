
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, Printer, Trash2 } from "lucide-react";
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
  [key: string]: any; // For dynamic fields
}

// Order for displaying top-level fields. Others will be appended.
const fieldOrder = [
  "formId", "userId", "userEmail", "submittedAt", "registeredAt", "status",
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
  // Check if the key suggests it's a date-like field and value is a string that might be a date
  if ((key.toLowerCase().includes('date') || key.toLowerCase().includes('at') || key.toLowerCase().endsWith('dob')) && typeof value === 'string') {
    try {
      // Attempt to parse as ISO string first (common from server timestamps)
      const dateFromISO = parseISO(value);
      if (!isNaN(dateFromISO.getTime())) {
        return format(dateFromISO, "PP pp"); // e.g., Jul 22, 2024 03:30 PM
      }
    } catch (e) { /* Not an ISO string, fall through */ }
    try {
      // Attempt to parse with new Date() for other common date string formats
      const dateFromGeneric = new Date(value);
      if (!isNaN(dateFromGeneric.getTime())) {
        return format(dateFromGeneric, "PP pp");
      }
    } catch (e) { /* Still not a valid date string, fall through */ }
  }
  // If it's already a Date object (e.g. from react-day-picker)
  if (value instanceof Date && !isNaN(value.getTime())) {
    return format(value, "PP pp");
  }
  if (Array.isArray(value)) return value.join(", ");
  // Avoid stringifying general objects here as they will be handled by recursive renderDetailItem
  if (typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value)) {
    return "[Object Data - See Below]"; // Placeholder, actual rendering is handled by recursion
  }
  return String(value);
};

// Recursive function to render form details
const renderDetailItem = (label: string, value: any): React.ReactNode => {
  const prettyLabel = label
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/_/g, ' ')        // Replace underscores with spaces
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter

  // If the value is an object (like formData or details), and it's not a Date or Array
  if ((label === 'formData' || label === 'details') && typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
    return (
      <React.Fragment key={label}>
        <dt className="font-semibold text-sm text-foreground printable-data-label">{prettyLabel}:</dt>
        <dd className="ml-4 mt-1 mb-2 space-y-1 text-sm text-muted-foreground break-words">
          {Object.keys(value).length > 0 ? (
            <dl className="space-y-1 border-l pl-3 ml-1"> {/* Nested DL for sub-items */}
              {Object.entries(value).map(([subKey, subValue]) =>
                renderDetailItem(subKey, subValue) // Recursive call
              )}
            </dl>
          ) : (
            <span className="italic">No additional details provided.</span>
          )}
        </dd>
      </React.Fragment>
    );
  }

  // For simple key-value pairs
  return (
    <React.Fragment key={label}>
      <dt className="font-semibold text-sm text-foreground printable-data-label">{prettyLabel}:</dt>
      <dd className="ml-4 text-sm text-muted-foreground break-words">{formatDisplayValue(label, value)}</dd>
    </React.Fragment>
  );
};


export default function ViewUserFormDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const formId = params.formId as string;
  const formType = searchParams.get('type') as string;

  const [formDetails, setFormDetails] = React.useState<FormDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (!user) {
        setError("You must be logged in to view this page.");
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  React.useEffect(() => {
    if (currentUser && formId && formType) {
      const fetchFormDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const idToken = await currentUser.getIdToken(true);
          const response = await fetch(`/api/user/form-detail?id=${formId}&type=${encodeURIComponent(formType)}`, {
            headers: { 'Authorization': `Bearer ${idToken}` }
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `Failed to fetch form details. Status: ${response.status}`);
          }
          const data = await response.json();
          setFormDetails({ ...data.form, formType: formType, id: formId }); 
        } catch (err: any) {
          setError(err.message);
          toast({ title: "Error Loading Form", description: err.message, variant: "destructive" });
        } finally {
          setIsLoading(false);
        }
      };
      fetchFormDetails();
    } else if (!currentUser && !isLoading) { // check isLoading to avoid premature error
        setError("Authentication required to view form details.");
        setIsLoading(false);
    }
  }, [currentUser, formId, formType, isLoading]); // Added isLoading to dependency array

  const handlePrint = () => {
    window.print();
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
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Card className="shadow-lg max-w-3xl mx-auto">
          <CardHeader>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/my-submitted-forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Error</h1>
        </div>
        <Card className="shadow-lg max-w-3xl mx-auto">
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard/my-submitted-forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Form Not Found</h1>
        </div>
        <Card className="shadow-lg max-w-3xl mx-auto">
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
                  className={buttonVariants({variant: "destructive"})}
                >
                   {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                  Confirm Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div id="printable-area" className="printable-area">
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
              Submitted on: {formDetails.submittedAt ? format(parseISO(formDetails.submittedAt), "PP pp") : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 printable-data-item"> {/* Apply printable-data-item to the main dl */}
              {orderedDetails.map(([key, value]) => renderDetailItem(key, value))}
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
