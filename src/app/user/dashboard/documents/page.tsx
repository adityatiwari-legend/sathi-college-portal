
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileIcon, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth, db, app as firebaseApp } from "@/lib/firebase/config"; // Import app
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

  const fetchDocuments = React.useCallback(async (userToFetchFor: User | null) => {
    console.log("UserSharedDocumentsPage: fetchDocuments called.");
    if (firebaseApp) {
      console.log("UserSharedDocumentsPage: Firebase app name:", firebaseApp.name);
    } else {
      console.error("UserSharedDocumentsPage: Firebase app (firebaseApp) is not initialized!");
    }
    if (db) {
        console.log("UserSharedDocumentsPage: Firestore db instance is available.");
    } else {
        console.error("UserSharedDocumentsPage: Firestore db instance is NOT available!");
    }
    
    if (!userToFetchFor) {
      console.log("UserSharedDocumentsPage: No user provided to fetchDocuments, setting error.");
      setError("Please log in to view shared documents.");
      setIsLoading(false);
      setDocuments([]);
      return;
    }
    console.log("UserSharedDocumentsPage: Current auth.currentUser at fetch start:", auth.currentUser ? auth.currentUser.uid : "null");
    console.log("UserSharedDocumentsPage: User object passed to fetchDocuments:", userToFetchFor ? userToFetchFor.uid : "null");


    if (!db) {
      console.error("UserSharedDocumentsPage: Firestore 'db' instance is not available when attempting to fetch.");
      setError("Database connection error. Please try again later.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`UserSharedDocumentsPage: Attempting to force token refresh for user: ${userToFetchFor.uid}`);
      await userToFetchFor.getIdToken(true); 
      console.log(`UserSharedDocumentsPage: Token refreshed successfully for user: ${userToFetchFor.uid}. Current auth.currentUser: ${auth.currentUser?.uid}`);
    } catch (tokenError: any) {
      console.error(`UserSharedDocumentsPage: Failed to refresh token for user ${userToFetchFor.uid}:`, JSON.stringify(tokenError, Object.getOwnPropertyNames(tokenError)));
      setError(`Authentication session issue: Could not refresh your session (Code: ${tokenError.code || 'TOKEN_REFRESH_FAILED'}). Please try logging out and back in.`);
      setIsLoading(false);
      setDocuments([]);
      return; 
    }

    try {
      console.log("UserSharedDocumentsPage: Querying 'uploadedDocuments' for admin uploads. User UID for query context:", userToFetchFor.uid);
      const documentsCollection = collection(db, "uploadedDocuments");
      
      // The query includes an orderBy clause. If this causes "Permission Denied",
      // it's highly likely a composite index is needed in Firestore.
      // Firestore error message in the browser console often provides a direct link to create it.
      const q = query(
        documentsCollection,
        where("uploaderContext", "==", "admin"),
        orderBy("uploadedAt", "desc") 
      );
      console.log("UserSharedDocumentsPage: Firestore query object created:", q);

      const querySnapshot = await getDocs(q);
      console.log(`UserSharedDocumentsPage: Firestore query executed. Found ${querySnapshot.docs.length} documents.`);
      
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
      
      setDocuments(fetchedDocs);
    } catch (err: any) {
      console.error("UserSharedDocumentsPage: Full error fetching shared documents:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      let errorMessage = err.message ? `${err.message} (Code: ${err.code || 'N/A'})` : "Failed to load shared documents.";
      if (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission-denied'))) {
        errorMessage = "Permission Denied. This usually means you need to create a composite index in Firestore for this query. Please check your browser's developer console. Firebase usually provides a direct link there to create the required index. Also, verify your Firestore security rules allow reads for authenticated users on the 'uploadedDocuments' collection.";
      }
      setError(errorMessage); // This will be displayed in the UI
      toast({ title: "Error Loading Documents", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []); 

  React.useEffect(() => {
    console.log("UserSharedDocumentsPage: useEffect for onAuthStateChanged mounting.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("UserSharedDocumentsPage: Auth state changed. User UID:", user ? user.uid : 'null');
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
        <Button variant="outline" size="icon" onClick={() => currentUser && fetchDocuments(currentUser)} disabled={isLoading || !currentUser} aria-label="Refresh documents">
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
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex flex-col items-center gap-2 text-center">
              <AlertTriangle className="h-8 w-8 mb-2 text-destructive" />
              <p className="text-sm font-semibold">Error Loading Documents</p>
              <p className="text-xs">{error}</p>
              {error.toLowerCase().includes("permission-denied") && error.toLowerCase().includes("index") && (
                <p className="text-xs mt-2 italic">
                  Firebase often provides a direct link in the browser's developer console (look for messages from Firestore) to create the required database index.
                </p>
              )}
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
