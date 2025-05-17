
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileIcon, Loader2, AlertTriangle, RefreshCw, ListChecks, FileText, BookMarked } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SharedDocument {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: Date | null; // Using Date object for easier formatting
  uploaderContext: string;
}

interface SubmittedForm {
  id: string;
  formType: 'Admission' | 'Course Registration';
  submittedAt: Date | null; // Using Date object
  // Add other common fields or specific form fields as needed for display
  desiredProgram?: string; // Example from admission form
  term?: string; // Example from course registration
  status?: string; // Placeholder for form status
}

export default function MyActivityPage() {
  const [sharedDocuments, setSharedDocuments] = React.useState<SharedDocument[]>([]);
  const [submittedForms, setSubmittedForms] = React.useState<SubmittedForm[]>([]);
  const [isLoadingSharedDocs, setIsLoadingSharedDocs] = React.useState(true);
  const [isLoadingSubmittedForms, setIsLoadingSubmittedForms] = React.useState(true);
  const [errorSharedDocs, setErrorSharedDocs] = React.useState<string | null>(null);
  const [errorSubmittedForms, setErrorSubmittedForms] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fetchSharedDocuments = async () => {
    if (!db) {
      setErrorSharedDocs("Firestore is not available.");
      setIsLoadingSharedDocs(false);
      return;
    }
    setIsLoadingSharedDocs(true);
    setErrorSharedDocs(null);
    try {
      const documentsCollection = collection(db, "uploadedDocuments");
      const q = query(
        documentsCollection,
        where("uploaderContext", "==", "admin"),
        orderBy("uploadedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedDocs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          originalFileName: data.originalFileName || "Unknown Filename",
          downloadUrl: data.downloadUrl || "#",
          contentType: data.contentType || "application/octet-stream",
          size: data.size || 0,
          uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : null,
          uploaderContext: data.uploaderContext || "unknown",
        } as SharedDocument;
      });
      setSharedDocuments(fetchedDocs);
    } catch (err: any) {
      console.error("Error fetching shared documents:", err);
      setErrorSharedDocs(err.message || "Failed to load shared documents.");
      toast({ title: "Error Loading Shared Documents", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingSharedDocs(false);
    }
  };

  const fetchSubmittedForms = async (user: User) => {
    if (!db) {
      setErrorSubmittedForms("Firestore is not available.");
      setIsLoadingSubmittedForms(false);
      return;
    }
    setIsLoadingSubmittedForms(true);
    setErrorSubmittedForms(null);
    try {
      const forms: SubmittedForm[] = [];

      // Fetch Admission Forms
      const admissionFormsCollection = collection(db, "admissionForms");
      const admissionQuery = query(
        admissionFormsCollection,
        where("userId", "==", user.uid),
        orderBy("submittedAt", "desc")
      );
      const admissionSnapshot = await getDocs(admissionQuery);
      admissionSnapshot.forEach((doc) => {
        const data = doc.data();
        forms.push({
          id: doc.id,
          formType: 'Admission',
          submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : null,
          desiredProgram: data.desiredProgram,
          status: data.status || "Submitted", // Placeholder
        });
      });

      // Fetch Course Registrations
      const courseRegCollection = collection(db, "courseRegistrations");
      const courseRegQuery = query(
        courseRegCollection,
        where("userId", "==", user.uid),
        orderBy("registeredAt", "desc") // Assuming 'registeredAt' field
      );
      const courseRegSnapshot = await getDocs(courseRegQuery);
      courseRegSnapshot.forEach((doc) => {
        const data = doc.data();
        forms.push({
          id: doc.id,
          formType: 'Course Registration',
          submittedAt: data.registeredAt instanceof Timestamp ? data.registeredAt.toDate() : (data.submittedAt instanceof Timestamp ? data.submittedAt.toDate() : null),
          term: data.term,
          status: data.status || "Submitted", // Placeholder
        });
      });
      
      // Sort all forms together by submission date, most recent first
      forms.sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));
      setSubmittedForms(forms);

    } catch (err: any) {
      console.error("Error fetching submitted forms:", err);
      setErrorSubmittedForms(err.message || "Failed to load your submitted forms.");
      toast({ title: "Error Loading Submitted Forms", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingSubmittedForms(false);
    }
  };
  
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchSharedDocuments();
        fetchSubmittedForms(user);
      } else {
        setSharedDocuments([]);
        setSubmittedForms([]);
        setIsLoadingSharedDocs(false);
        setIsLoadingSubmittedForms(false);
        setErrorSharedDocs("Please log in to view this page.");
        setErrorSubmittedForms(null); // Clear this error if user logs out
      }
    });
    return () => unsubscribe();
  }, []);

  const getFileIconElement = (contentType: string) => {
    if (contentType.startsWith("image/")) return <FileIcon className="h-5 w-5 text-purple-500" aria-label="Image file" />;
    if (contentType === "application/pdf") return <FileIcon className="h-5 w-5 text-red-500" aria-label="PDF file" />;
    if (contentType.includes("wordprocessingml") || contentType.includes("msword")) return <FileIcon className="h-5 w-5 text-blue-600" aria-label="Word document" />;
    return <FileIcon className="h-5 w-5 text-muted-foreground" aria-label="Generic file" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const refreshAllData = () => {
    if (currentUser) {
      fetchSharedDocuments();
      fetchSubmittedForms(currentUser);
    } else {
       toast({ title: "Not Authenticated", description: "Please log in to refresh data.", variant: "destructive" });
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
          <h1 className="text-3xl font-bold tracking-tight">My Activity</h1>
        </div>
         <Button variant="outline" size="icon" onClick={refreshAllData} disabled={isLoadingSharedDocs || isLoadingSubmittedForms} aria-label="Refresh data">
            <RefreshCw className={cn("h-4 w-4", (isLoadingSharedDocs || isLoadingSubmittedForms) && "animate-spin")} />
        </Button>
      </div>

      <Tabs defaultValue="my-forms" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-forms">My Submitted Forms</TabsTrigger>
          <TabsTrigger value="shared-documents">Shared Documents</TabsTrigger>
        </TabsList>
        <TabsContent value="my-forms">
          <Card className="shadow-lg mt-2">
            <CardHeader>
              <CardTitle>My Submitted Forms</CardTitle>
              <CardDescription>
                View the status and details of your submitted forms.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubmittedForms && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Loading your forms...</p>
                </div>
              )}
              {errorSubmittedForms && !isLoadingSubmittedForms && (
                <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">{errorSubmittedForms}</p>
                </div>
              )}
              {!isLoadingSubmittedForms && !errorSubmittedForms && submittedForms.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  You have not submitted any forms yet.
                </p>
              )}
              {!isLoadingSubmittedForms && !errorSubmittedForms && submittedForms.length > 0 && (
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
                            {form.formType === 'Admission' ? 
                              <FileText className="h-5 w-5 text-blue-500" /> : 
                              <BookMarked className="h-5 w-5 text-green-500" />
                            }
                          </TableCell>
                          <TableCell className="font-medium">{form.formType}</TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground truncate max-w-xs">
                            {form.formType === 'Admission' ? form.desiredProgram : form.term}
                          </TableCell>
                          <TableCell>
                            {form.submittedAt ? format(form.submittedAt, "PP") : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
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
        </TabsContent>
        <TabsContent value="shared-documents">
          <Card className="shadow-lg mt-2">
            <CardHeader>
              <CardTitle>Shared Documents</CardTitle>
              <CardDescription>
                Documents shared by the Sathi College administration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSharedDocs && (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-2 text-muted-foreground">Loading documents...</p>
                </div>
              )}
              {errorSharedDocs && !isLoadingSharedDocs && (
                <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">{errorSharedDocs}</p>
                </div>
              )}
              {!isLoadingSharedDocs && !errorSharedDocs && sharedDocuments.length === 0 && (
                <p className="text-center text-muted-foreground py-10">
                  No documents have been shared by the admin yet.
                </p>
              )}
              {!isLoadingSharedDocs && !errorSharedDocs && sharedDocuments.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px] sm:w-[80px]">Type</TableHead>
                        <TableHead>File Name</TableHead>
                        <TableHead className="hidden sm:table-cell">Size</TableHead>
                        <TableHead className="hidden md:table-cell">Uploaded On</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sharedDocuments.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell>{getFileIconElement(doc.contentType)}</TableCell>
                          <TableCell className="font-medium max-w-[150px] sm:max-w-xs truncate" title={doc.originalFileName}>{doc.originalFileName}</TableCell>
                          <TableCell className="hidden sm:table-cell">{formatFileSize(doc.size)}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {doc.uploadedAt ? format(doc.uploadedAt, "PP") : 'N/A'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" asChild>
                              <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" download={doc.originalFileName}>
                                <Download className="mr-1 sm:mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Download</span>
                              </a>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
