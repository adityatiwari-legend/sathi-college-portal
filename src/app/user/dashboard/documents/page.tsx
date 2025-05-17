
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileIcon, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth, db } from "@/lib/firebase/config"; 
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

interface SharedDocument {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: Timestamp | Date | null; 
  uploaderContext: string;
}

export default function UserSharedDocumentsPage() {
  const [documents, setDocuments] = React.useState<SharedDocument[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsLoading(true); 
      setError(null);
      setDocuments([]); 
      setCurrentUser(user);

      if (user) {
        console.log("UserSharedDocumentsPage: User authenticated, attempting to fetch documents...");
        try {
          const documentsCollection = collection(db, "uploadedDocuments");
          const q = query(
            documentsCollection,
            where("uploaderContext", "==", "admin"), // Only fetch documents uploaded by admin
            orderBy("uploadedAt", "desc")
          );
          const querySnapshot = await getDocs(q);
          
          console.log(`UserSharedDocumentsPage: Firestore query executed for admin documents. Found ${querySnapshot.docs.length} documents.`);

          const fetchedDocs = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              originalFileName: data.originalFileName || "Unknown Filename",
              downloadUrl: data.downloadUrl || "#",
              contentType: data.contentType || "application/octet-stream",
              size: data.size || 0,
              // Convert Firestore Timestamp to Date object for consistent handling
              uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : (data.uploadedAt || null),
              uploaderContext: data.uploaderContext || "unknown",
            } as SharedDocument;
          });
          setDocuments(fetchedDocs);
          if (fetchedDocs.length === 0) {
            console.log("UserSharedDocumentsPage: No documents found with uploaderContext 'admin'.");
          }
        } catch (err: any) {
          console.error("UserSharedDocumentsPage: Error fetching documents:", err);
          let errorMessage = "Failed to load documents. Please ensure you are connected to the internet and try again.";
          if (err.code) {
              switch (err.code) {
                  case 'permission-denied':
                      errorMessage = "Permission denied. You may not have access to view these documents or Firestore rules are misconfigured.";
                      break;
                  case 'unauthenticated':
                      errorMessage = "Authentication required. Please log in to view documents.";
                      break;
                  default:
                      errorMessage = `Error: ${err.message} (Code: ${err.code})`;
              }
          } else if (err.message) {
              errorMessage = err.message;
          }
          setError(errorMessage);
          toast({
            title: "Error Loading Documents",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log("UserSharedDocumentsPage: No user authenticated. Cannot fetch documents.");
        setError("You must be logged in to view shared documents.");
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); 

  const getFileIconElement = (contentType: string) => {
    if (contentType.startsWith("image/")) return <FileIcon className="h-5 w-5 text-purple-500" aria-label="Image file" />;
    if (contentType === "application/pdf") return <FileIcon className="h-5 w-5 text-red-500" aria-label="PDF file" />;
    if (contentType.includes("wordprocessingml") || contentType.includes("msword")) return <FileIcon className="h-5 w-5 text-blue-600" aria-label="Word document" />;
    if (contentType.includes("spreadsheetml") || contentType.includes("excel")) return <FileIcon className="h-5 w-5 text-green-600" aria-label="Excel spreadsheet" />;
    if (contentType.includes("presentationml") || contentType.includes("powerpoint")) return <FileIcon className="h-5 w-5 text-orange-500" aria-label="PowerPoint presentation" />;
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
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Available Documents</CardTitle>
          <CardDescription>
            View and download documents shared by the Sathi College administration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-10" aria-live="polite">
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
              No documents have been shared by the admin yet, or there was an issue fetching them.
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
                        {doc.uploadedAt && doc.uploadedAt instanceof Date ? format(doc.uploadedAt, "PP") : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
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
