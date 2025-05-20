
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileIcon, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth, db, app as firebaseApp } from "@/lib/firebase/config";
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
  uploadedAt: Date | null;
  uploaderContext: string;
}

export default function UserSharedDocumentsPage() {
  const [documents, setDocuments] = React.useState<SharedDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fetchDocuments = React.useCallback(async (user: User | null) => {
    console.log("UserSharedDocumentsPage: fetchDocuments called. User from onAuthStateChanged:", user ? user.uid : "null");
    console.log("UserSharedDocumentsPage: auth.currentUser at fetch start:", auth.currentUser ? auth.currentUser.uid : "null");
    console.log("UserSharedDocumentsPage: Firebase app name:", firebaseApp ? firebaseApp.name : "Firebase app not initialized");
    console.log("UserSharedDocumentsPage: Firestore db instance:", db ? "Available" : "NOT AVAILABLE");

    if (!user) {
      setError("Please log in to view shared documents.");
      setIsLoading(false);
      setDocuments([]);
      console.log("UserSharedDocumentsPage: No user, exiting fetchDocuments.");
      return;
    }
    if (!db) {
      console.error("UserSharedDocumentsPage: Firestore 'db' instance is not available.");
      setError("Database connection error. Please try again later.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

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

    try {
      console.log("UserSharedDocumentsPage: Querying 'uploadedDocuments' for admin uploads. User UID for query:", user.uid);
      const documentsCollection = collection(db, "uploadedDocuments");
      
      // Temporarily commenting out orderBy for diagnostics.
      // If this works, the issue is likely a missing composite index.
      // The original query was: query(documentsCollection, where("uploaderContext", "==", "admin"), orderBy("uploadedAt", "desc"));
      const q = query(
        documentsCollection,
        where("uploaderContext", "==", "admin")
        // orderBy("uploadedAt", "desc") // Keep this commented out for now
      );
      console.log("UserSharedDocumentsPage: Firestore query object created (orderBy is currently commented out for diagnosis):", q);

      const querySnapshot = await getDocs(q);
      console.log(`UserSharedDocumentsPage: Firestore query executed. Found ${querySnapshot.docs.length} documents.`);
      
      if (querySnapshot.docs.length > 0) {
         console.warn("UserSharedDocumentsPage: Data loaded successfully WITHOUT 'orderBy'. If the page previously failed with 'Permission Denied' and 'orderBy', this strongly suggests a MISSING COMPOSITE INDEX. Check your browser console for a Firestore link to create the index for the query with 'orderBy(\"uploadedAt\", \"desc\")'.");
      }


      const fetchedDocs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          originalFileName: data.originalFileName || "Unknown Filename",
          downloadUrl: data.downloadUrl || "#",
          contentType: data.contentType || "application/octet-stream",
          size: data.size || 0,
          uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : (typeof data.uploadedAt === 'string' ? new Date(data.uploadedAt) : null),
          uploaderContext: data.uploaderContext || "unknown",
        } as SharedDocument;
      });
      
      // Client-side sorting if orderBy was removed from the query
      fetchedDocs.sort((a, b) => (b.uploadedAt?.getTime() || 0) - (a.uploadedAt?.getTime() || 0));

      setDocuments(fetchedDocs);
    } catch (err: any) {
      console.error("UserSharedDocumentsPage: Full error fetching shared documents:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      let errorMessage = err.message ? `${err.message} (Code: ${err.code || 'N/A'})` : "Failed to load shared documents.";
      if (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission-denied'))) {
        errorMessage = "Permission Denied. You may not have access to view these documents. Please VERIFY your Firestore security rules are correctly published and that the user is authenticated. CRITICAL: If your query involves ordering or multiple filters on different fields, Firestore likely requires a composite index. Check your browser's developer console for a direct link from Firestore to create the necessary index. This 'Permission Denied' can sometimes mask a missing index error.";
      }
      setError(errorMessage);
      toast({ title: "Error Loading Documents", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []); 

  React.useEffect(() => {
    console.log("UserSharedDocumentsPage: useEffect for onAuthStateChanged mounting.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("UserSharedDocumentsPage: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (user) {
        fetchDocuments(user); 
      } else {
        setDocuments([]);
        setIsLoading(false);
        setError("Please log in to view shared documents.");
      }
    });
    return () => {
        console.log("UserSharedDocumentsPage: useEffect for onAuthStateChanged unmounting.");
        unsubscribe();
    };
  }, [fetchDocuments]); 

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
        <Button variant="outline" size="icon" onClick={() => fetchDocuments(currentUser)} disabled={isLoading} aria-label="Refresh documents">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Documents from Admin</CardTitle>
          <CardDescription>
            View and download documents shared by the Sathi College administration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading documents...</p>
            </div>
          )}
          {error && !isLoading && (
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && documents.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              No documents have been shared by the admin yet.
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
                        {doc.uploadedAt ? format(doc.uploadedAt, "PP pp") : 'N/A'}
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
    
