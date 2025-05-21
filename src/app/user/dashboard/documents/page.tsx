
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileIcon as LucideFileIcon, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth, app } from "@/lib/firebase/config"; // Use 'app'
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface UploadedAdminDocument {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: string | null; 
  uploaderContext: string;
}

export default function UserSharedDocumentsPage() {
  const [documents, setDocuments] = React.useState<UploadedAdminDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fetchDocuments = React.useCallback(async (user: User | null) => {
    console.log("UserSharedDocumentsPage: fetchDocuments called. CurrentUser from auth state:", user?.uid);
    console.log("UserSharedDocumentsPage: Firebase app name:", app?.name);

    if (!user) {
      setError("You must be logged in to view shared documents.");
      setIsLoading(false);
      setDocuments([]);
      console.warn("UserSharedDocumentsPage: No user found, cannot fetch documents.");
      return;
    }

    setIsLoading(true);
    setError(null);

    if (user) { 
      try {
        console.log(`UserSharedDocumentsPage: Attempting to force token refresh for user: ${user.uid}`);
        await user.getIdToken(true); 
        console.log(`UserSharedDocumentsPage: Token refreshed successfully for user: ${user.uid}. Current auth.currentUser: ${auth.currentUser?.uid}`);
      } catch (tokenError: any) {
        console.error(`UserSharedDocumentsPage: Failed to refresh token for user ${user.uid}:`, JSON.stringify(tokenError, Object.getOwnPropertyNames(tokenError)));
        setError(`Authentication session issue: Could not refresh your session (Code: ${tokenError.code || 'TOKEN_REFRESH_FAILED'}). Please try logging out and back in.`);
        setIsLoading(false);
        setDocuments([]); 
        return; 
      }
    }

    try {
      console.log("UserSharedDocumentsPage: Fetching documents from /api/admin/list-documents...");
      const response = await fetch("/api/admin/list-documents"); // API call
      
      if (!response.ok) {
        let errorData = { error: { message: "Failed to fetch shared documents from server." }};
        try {
            errorData = await response.json();
        } catch (e) {
            console.warn("UserSharedDocumentsPage: Could not parse error response as JSON.");
        }
        const serverErrorMessage = (typeof errorData.error === 'object' && errorData.error !== null && errorData.error.message) 
                                  ? errorData.error.message 
                                  : (typeof errorData.error === 'string' ? errorData.error : `Failed to fetch shared documents: ${response.statusText}`);
        throw new Error(serverErrorMessage);
      }
      const data: UploadedAdminDocument[] = await response.json();
      console.log(`UserSharedDocumentsPage: Successfully fetched ${data.length} shared documents via API.`);
      
      setDocuments(data.map(doc => ({
        ...doc,
        uploadedAt: doc.uploadedAt ? new Date(doc.uploadedAt).toISOString() : null 
      })));

    } catch (err: any) {
      console.error("UserSharedDocumentsPage: Full error fetching shared documents:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      let errorMessage = err.message ? `${err.message} (Code: ${err.code || 'N/A'})` : "Failed to load shared documents.";
      if (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission-denied'))) {
         errorMessage = "Permission Denied. This usually means you need to create a composite index in Firestore for this query. Please check your browser's developer console. Firebase usually provides a direct link there to create the required index. Also, verify your Firestore security rules allow reads for authenticated users on the 'uploadedDocuments' collection.";
       }
      setError(errorMessage);
      toast({ title: "Error Loading Documents", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);


  React.useEffect(() => {
    console.log("UserSharedDocumentsPage: onAuthStateChanged effect setup.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("UserSharedDocumentsPage: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user); 
      if (user) {
        fetchDocuments(user);
      } else {
        setError("Please log in to view shared documents.");
        setIsLoading(false);
        setDocuments([]); 
      }
    });
    return () => {
      console.log("UserSharedDocumentsPage: Cleaning up onAuthStateChanged subscription.");
      unsubscribe();
    };
  }, [fetchDocuments]);
  
  const getFileIconElement = (contentType: string) => {
    if (contentType.startsWith("image/")) return <LucideFileIcon className="h-5 w-5 text-purple-500" aria-label="Image file"/>;
    if (contentType === "application/pdf") return <LucideFileIcon className="h-5 w-5 text-red-500" aria-label="PDF file"/>;
    if (contentType.includes("wordprocessingml") || contentType.includes("msword")) return <LucideFileIcon className="h-5 w-5 text-blue-600" aria-label="Word document"/>;
    if (contentType.includes("spreadsheetml") || contentType.includes("excel")) return <LucideFileIcon className="h-5 w-5 text-green-600" aria-label="Excel spreadsheet"/>;
    if (contentType.includes("presentationml") || contentType.includes("powerpoint")) return <LucideFileIcon className="h-5 w-5 text-orange-500" aria-label="PowerPoint presentation"/>;
    return <LucideFileIcon className="h-5 w-5 text-muted-foreground" aria-label="Generic file"/>;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading && (!currentUser && auth.currentUser === null) ) { 
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
             <p className="ml-3 text-muted-foreground">Checking authentication and loading documents...</p>
          </CardContent>
        </Card>
      </div>
    );
  }


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
          <h1 className="text-3xl font-bold tracking-tight">Shared Documents</h1>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchDocuments(currentUser)} disabled={isLoading || !currentUser} aria-label="Refresh documents">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Available Documents</CardTitle>
          <CardDescription>
            View and download documents shared by the college administration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && !error && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading documents...</p>
            </div>
          )}
          {error && ( 
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && documents.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              No documents have been shared by the administration yet.
            </p>
          )}
          {!isLoading && !error && documents.length > 0 && (
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
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>{getFileIconElement(doc.contentType)}</TableCell>
                      <TableCell className="font-medium max-w-[150px] sm:max-w-xs truncate" title={doc.originalFileName}>{doc.originalFileName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatFileSize(doc.size)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.uploadedAt ? format(new Date(doc.uploadedAt), "PP pp") : 'N/A'}
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
    </div>
  );
}
    

    