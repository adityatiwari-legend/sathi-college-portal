"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileIcon, Loader2, AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { auth, db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface UploadedTimetable {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: Date | null;
}

export default function UserViewTimetablePage() {
  const [timetables, setTimetables] = React.useState<UploadedTimetable[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fetchTimetables = async (user: User | null) => {
    console.log("UserViewTimetablePage: fetchTimetables called. User:", user ? user.uid : "null");
    if (!user) {
      setError("Please log in to view timetables.");
      setIsLoading(false);
      setTimetables([]);
      return;
    }
    if (!db) {
      console.error("UserViewTimetablePage: Firestore 'db' instance is not available.");
      setError("Database connection error. Please try again later.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      console.log("UserViewTimetablePage: Querying 'uploadedDocuments' for timetable context.");
      const documentsCollection = collection(db, "uploadedDocuments");
      const q = query(
        documentsCollection,
        where("uploaderContext", "==", "timetable"),
        orderBy("uploadedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      console.log(`UserViewTimetablePage: Firestore query executed. Found ${querySnapshot.docs.length} timetables.`);
      
      const fetchedDocs = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          originalFileName: data.originalFileName || "Unknown Timetable",
          downloadUrl: data.downloadUrl || "#",
          contentType: data.contentType || "application/pdf",
          size: data.size || 0,
          uploadedAt: data.uploadedAt instanceof Timestamp ? data.uploadedAt.toDate() : (typeof data.uploadedAt === 'string' ? new Date(data.uploadedAt) : null),
        } as UploadedTimetable;
      });
      setTimetables(fetchedDocs);
    } catch (err: any) {
      console.error("UserViewTimetablePage: Full error fetching timetables:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
      const errorMessage = err.message ? `${err.message} (Code: ${err.code || 'N/A'})` : "Failed to load timetables.";
      setError(errorMessage);
      toast({ title: "Error Loading Timetables", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchTimetables(user);
      } else {
        setTimetables([]);
        setIsLoading(false);
        setError("Please log in to view timetables.");
      }
    });
    return () => unsubscribe();
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight">View Timetables</h1>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchTimetables(currentUser)} disabled={isLoading} aria-label="Refresh timetables">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>College Timetables</CardTitle>
          <CardDescription>
            Download the latest timetables uploaded by the administration.
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
              No timetables have been shared by the admin yet.
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
                      <TableCell><FileIcon className="h-5 w-5 text-red-500" aria-label="PDF file" /></TableCell>
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
