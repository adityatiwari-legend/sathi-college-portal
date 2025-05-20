
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, AlertTriangle, FileText, BookMarked, ClipboardList, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface FormDetail {
  id: string;
  formType: string;
  [key: string]: any; // For other dynamic fields
}

export default function ViewFormDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const formId = params.formId as string;
  const formType = searchParams.get("type");

  const [formDetails, setFormDetails] = React.useState<FormDetail | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (formId && formType) {
      setIsLoading(true);
      setError(null);
      fetch(`/api/admin/form-detail?id=${formId}&type=${formType}`)
        .then(async (res) => {
          if (!res.ok) {
            let errorData;
            try {
              errorData = await res.json();
            } catch (e) {
              throw new Error(`Failed to load form details. Status: ${res.status}`);
            }
            throw new Error(errorData?.error?.message || `Failed to load form details. Status: ${res.status}`);
          }
          return res.json();
        })
        .then((data: FormDetail) => {
          setFormDetails(data);
        })
        .catch((err: any) => {
          setError(err.message);
          toast({ title: "Error Loading Form", description: err.message, variant: "destructive" });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
        setError("Form ID or Type is missing.");
        setIsLoading(false);
    }
  }, [formId, formType]);

  const renderDetailItem = (label: string, value: any) => {
    let displayValue = value;
    if (value === null || value === undefined) {
      displayValue = "N/A";
    } else if (typeof value === 'boolean') {
      displayValue = value ? "Yes" : "No";
    } else if (Array.isArray(value)) {
      displayValue = value.join(", ") || "N/A";
    } else if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
      try {
        displayValue = JSON.stringify(value, null, 2);
        return (
          <div key={label} className="mb-3 pb-3 border-b border-border last:border-b-0 last:pb-0">
            <dt className="text-sm font-medium text-muted-foreground capitalize">{label.replace(/([A-Z])/g, ' $1')}</dt>
            <dd className="mt-1 text-sm text-foreground"><pre className="whitespace-pre-wrap break-all bg-muted/50 p-2 rounded-md">{displayValue}</pre></dd>
          </div>
        );
      } catch {
        displayValue = "[Object]";
      }
    } else if (typeof value === 'string' && (label === 'submittedAt' || label === 'registeredAt' || label === 'uploadedAt' || label === 'dateOfBirth')) {
       try {
         displayValue = format(new Date(value), "PP pp");
       } catch (e) {
         // keep original string if not a valid date
       }
    }
    // Special handling for formData to display its nested properties
    if (label === 'formData' && typeof value === 'object' && value !== null) {
      return (
        <div key={label} className="mb-3 pb-3 border-b border-border last:border-b-0 last:pb-0">
          <dt className="text-sm font-medium text-muted-foreground capitalize">Custom Fields</dt>
          <dd className="mt-1 text-sm text-foreground">
            <dl className="divide-y divide-border">
              {Object.entries(value).map(([nestedKey, nestedValue]) => renderDetailItem(nestedKey, nestedValue))}
            </dl>
          </dd>
        </div>
      );
    }

    return (
      <div key={label} className="mb-3 pb-3 border-b border-border last:border-b-0 last:pb-0">
        <dt className="text-sm font-medium text-muted-foreground capitalize">{label.replace(/([A-Z])/g, ' $1')}</dt>
        <dd className="mt-1 text-sm text-foreground break-words">{String(displayValue)}</dd>
      </div>
    );
  };

  const getFormIcon = (type: string | null | undefined) => {
    switch (type) {
      case 'Admission': return <FileText className="h-8 w-8 text-blue-500 mr-2" />;
      case 'Course Registration': return <BookMarked className="h-8 w-8 text-green-500 mr-2" />;
      case 'Custom Form': return <ClipboardList className="h-8 w-8 text-purple-500 mr-2" />;
      default: return <FileText className="h-8 w-8 text-muted-foreground mr-2" />;
    }
  };
  
  const excludedKeys = ['id', 'formType', 'userId', 'userEmail', 'storagePath', 'lastUpdatedAt', 'uploaderContext'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/dashboard/all-submitted-forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Form Details</h1>
      </div>

      {isLoading && (
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-5 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}

      {error && !isLoading && (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center text-destructive">
                    <AlertTriangle className="h-6 w-6 mr-2" /> Error Loading Form
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p>{error}</p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/admin/dashboard/all-submitted-forms">Back to All Forms</Link>
                </Button>
            </CardContent>
        </Card>
      )}

      {!isLoading && !error && formDetails && (
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center">
              {getFormIcon(formDetails.formType)}
              <div>
                <CardTitle className="text-2xl">{formDetails.formType === 'Custom Form' ? formDetails.title || 'Custom Form Details' : `${formDetails.formType} Details`}</CardTitle>
                <CardDescription>
                  Detailed view of submission ID: {formDetails.id}
                   {formDetails.formType === 'Custom Form' && formDetails.formId && ` (Internal Form ID: ${formDetails.formId})`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="divide-y divide-border">
              <div className="mb-3 pb-3 border-b border-border last:border-b-0 last:pb-0">
                 <dt className="text-sm font-medium text-muted-foreground flex items-center">
                    <UserCircle className="h-4 w-4 mr-1.5"/> Submitting User
                </dt>
                 <dd className="mt-1 text-sm text-foreground">{formDetails.userEmail || formDetails.userId || "N/A"}</dd>
              </div>

              {Object.entries(formDetails)
                .filter(([key]) => !excludedKeys.includes(key) && (formDetails.formType !== 'Custom Form' || key !== 'title' && key !== 'description'))
                .map(([key, value]) => renderDetailItem(key, value))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
