
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Added for navigation
import { ArrowLeft, Loader2, AlertTriangle, RefreshCw, ListFilter, FileText, BookMarked, UserCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

interface SubmittedForm {
  id: string;
  formType: 'Admission' | 'Course Registration' | 'Custom Form'; // Added 'Custom Form'
  userId: string;
  userEmail?: string;
  submittedAt: string | null; 
  details?: Record<string, any>;
  status?: string;
  formId?: string; // For custom forms
  title?: string; // For custom forms, title from definition
}

export default function AllSubmittedFormsPage() {
  const router = useRouter(); // Initialize router
  const [allForms, setAllForms] = React.useState<SubmittedForm[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<"all" | "Admission" | "Course Registration" | "Custom Form">("all");

  const fetchAllForms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/all-forms");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch forms: ${response.statusText}`);
      }
      const data: SubmittedForm[] = await response.json();
      setAllForms(data);
    } catch (err: any) {
      console.error("Error fetching all submitted forms:", err);
      setError(err.message || "Could not load submitted forms.");
      toast({ title: "Error Loading Forms", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchAllForms();
  }, []);

  const filteredForms = React.useMemo(() => {
    if (filter === "all") return allForms;
    return allForms.filter(form => form.formType === filter);
  }, [allForms, filter]);

  const getFormTypeIcon = (formType: SubmittedForm['formType']) => {
    switch (formType) {
      case 'Admission':
        return <FileText className="h-5 w-5 text-blue-500" aria-label="Admission Form" />;
      case 'Course Registration':
        return <BookMarked className="h-5 w-5 text-green-500" aria-label="Course Registration Form" />;
      case 'Custom Form':
        return <FileText className="h-5 w-5 text-purple-500" aria-label="Custom Form" />; // Example icon
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" aria-label="Form" />;
    }
  };

  const getFormDetailsSummary = (form: SubmittedForm): string => {
    if (form.formType === 'Admission') {
      return `Applicant: ${form.details?.fullName || 'N/A'}, Program: ${form.details?.desiredProgram || 'N/A'}`;
    }
    if (form.formType === 'Course Registration') {
      return `Student ID: ${form.details?.studentId || 'N/A'}, Term: ${form.details?.term || 'N/A'}, Courses: ${(form.details?.selectedCourses as string[] || []).length}`;
    }
     if (form.formType === 'Custom Form') {
      return `Form: ${form.title || form.formId || 'Custom Inquiry'}. Fields: ${Object.keys(form.details?.formData || {}).length}`;
    }
    return "No details available.";
  };

  const handleViewDetails = (form: SubmittedForm) => {
    router.push(`/admin/dashboard/view-form/${form.id}?type=${encodeURIComponent(form.formType)}`);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">All Submitted Forms</h1>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <ListFilter className="mr-2 h-4 w-4" />
                Filter ({filter === "all" ? "All" : filter})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Form Type</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={filter === "all"}
                onCheckedChange={() => setFilter("all")}
              >
                All Forms
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === "Admission"}
                onCheckedChange={() => setFilter("Admission")}
              >
                Admission Forms
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === "Course Registration"}
                onCheckedChange={() => setFilter("Course Registration")}
              >
                Course Registrations
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter === "Custom Form"}
                onCheckedChange={() => setFilter("Custom Form")}
              >
                Custom Forms
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon" onClick={fetchAllForms} disabled={isLoading} aria-label="Refresh forms">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Submitted Application Overview</CardTitle>
          <CardDescription>
            Review all forms submitted by users across the portal. Click a row to view details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading submitted forms...</p>
            </div>
          )}
          {error && !isLoading && (
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && filteredForms.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              {filter === "all" ? "No forms have been submitted yet." : `No ${filter} forms have been submitted yet.`}
            </p>
          )}
          {!isLoading && !error && filteredForms.length > 0 && (
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Form Type</TableHead>
                    <TableHead className="hidden md:table-cell">User</TableHead>
                    <TableHead>Submitted On</TableHead>
                    <TableHead className="hidden sm:table-cell">Summary</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                     <TableHead className="w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredForms.map((form) => (
                    <TableRow 
                      key={form.id} 
                      onClick={() => handleViewDetails(form)}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell>{getFormTypeIcon(form.formType)}</TableCell>
                      <TableCell className="font-medium">
                        {form.formType === 'Custom Form' ? (form.title || form.formId || 'Custom Form') : form.formType}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground" title={form.userEmail || form.userId}>
                        <div className="flex items-center gap-1">
                          <UserCircle className="h-4 w-4 flex-shrink-0"/> 
                          <span className="truncate max-w-[150px]">{form.userEmail || form.userId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {form.submittedAt ? format(new Date(form.submittedAt), "PP pp") : 'N/A'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-xs text-muted-foreground truncate max-w-xs" title={getFormDetailsSummary(form)}>
                        {getFormDetailsSummary(form)}
                      </TableCell>
                       <TableCell className="text-right">
                        <span className={cn(
                          "px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap",
                          form.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" :
                          form.status === "Rejected" ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" :
                          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                        )}>
                          {form.status || "Submitted"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleViewDetails(form); }} aria-label="View Details">
                          <Eye className="h-4 w-4" />
                        </Button>
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
