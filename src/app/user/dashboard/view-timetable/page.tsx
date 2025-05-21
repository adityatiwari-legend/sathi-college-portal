
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
import { auth, db, firebaseApp } from "@/lib/firebase/config"; // db might not be directly used here, but app and auth are
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";


interface UploadedTimetable {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: string | null; // API returns ISO string
  uploaderContext: string;
}

export default function UserViewTimetablePage() {
  const [timetables, setTimetables] = React.useState<UploadedTimetable[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fetchTimetables = React.useCallback(async (user: User | null) => {
    console.log("UserViewTimetablePage: fetchTimetables called. Current auth object:", auth.currentUser, "Firebase App name:", firebaseApp?.name);
    if (!user) {
      setError("You must be logged in to view timetables.");
      setIsLoading(false);
      setTimetables([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      console.log(`UserViewTimetablePage: Attempting to force token refresh for user: ${user.uid}`);
      await user.getIdToken(true); // Force refresh the ID token
      console.log(`UserViewTimetablePage: Token refreshed successfully for user: ${user.uid}. Current auth.currentUser UID: ${auth.currentUser?.uid}`);

      console.log("UserViewTimetablePage: Fetching timetables from /api/admin/list-timetables...");
      const response = await fetch("/api/admin/list-timetables");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: { message: `Failed to fetch timetables: Server responded with ${response.status}` }}));
        throw new Error(errorData.error?.message || `Failed to fetch timetables: ${response.statusText}`);
      }
      const data: UploadedTimetable[] = await response.json();
      console.log(`UserViewTimetablePage: Successfully fetched ${data.length} timetables.`);
      setTimetables(data.map(tt => ({
        ...tt,
        uploadedAt: tt.uploadedAt ? new Date(tt.uploadedAt).toISOString() : null // Ensure it remains ISO string or null
      })));
    } catch (err: any) {
      console.error("UserViewTimetablePage: Full error fetching timetables:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      let errorMessage = err.message ? `${err.message} (Code: ${err.code || 'N/A'})` : "Failed to load timetables.";
      if (err.code === 'permission-denied' || (err.message && err.message.toLowerCase().includes('permission-denied'))) {
        errorMessage = "Permission Denied. This usually means you need to create a composite index in Firestore for this query. Please check your browser's developer console. Firebase usually provides a direct link there to create the required index. Also, verify your Firestore security rules allow reads for authenticated users on the 'uploadedDocuments' collection.";
      }
      setError(errorMessage);
      toast({ title: "Error Loading Timetables", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("UserViewTimetablePage: Auth state changed. User:", user ? user.uid : 'null');
      setCurrentUser(user);
      if (user) {
        fetchTimetables(user);
      } else {
        setError("Please log in to view timetables.");
        setTimetables([]);
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, [fetchTimetables]);
  
  const getFileIconElement = (contentType: string) => {
    if (contentType === "application/pdf") return <LucideFileIcon className="h-5 w-5 text-red-500" aria-label="PDF file" />;
    return <LucideFileIcon className="h-5 w-5 text-muted-foreground" aria-label="Generic file" />;
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading && currentUser === null) { // Initial auth check phase
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
             <p className="ml-3 text-muted-foreground">Checking authentication...</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Academic Timetables</h1>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchTimetables(currentUser)} disabled={isLoading || !currentUser} aria-label="Refresh timetables">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>View Timetables</CardTitle>
          <CardDescription>
            Download the latest academic timetables and schedules provided by the administration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading timetables...</p>
            </div>
          )}
          {error && !isLoading && (
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && timetables.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              No timetables have been uploaded by the administration yet.
            </p>
          )}
          {!isLoading && !error && timetables.length > 0 && (
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
                  {timetables.map((doc) => (
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
