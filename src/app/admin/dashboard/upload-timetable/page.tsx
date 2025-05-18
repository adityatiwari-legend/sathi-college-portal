"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, UploadCloud, FileUp, CheckCircle, AlertTriangle, Loader2, FileIcon, Download, RefreshCw, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface UploadedTimetable {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: string | null; 
}

export default function AdminUploadTimetablePage() { 
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);

  const [adminTimetables, setAdminTimetables] = React.useState<UploadedTimetable[]>([]);
  const [isLoadingTimetables, setIsLoadingTimetables] = React.useState(true);
  const [fetchTimetableError, setFetchTimetableError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchAdminTimetables = async () => {
    setIsLoadingTimetables(true);
    setFetchTimetableError(null);
    try {
      const response = await fetch("/api/admin/list-timetables");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch timetables: ${response.statusText}`);
      }
      const data: UploadedTimetable[] = await response.json();
      setAdminTimetables(data);
    } catch (error: any) {
      console.error("Error fetching admin timetables:", error);
      setFetchTimetableError(error.message || "Could not load timetables.");
      toast({ title: "Error Loading Timetables", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingTimetables(false);
    }
  };

  React.useEffect(() => {
    fetchAdminTimetables();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid File Type",
          description: "Please select a PDF file for the timetable.",
          variant: "destructive",
        });
        setSelectedFile(null);
        setFileName(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setSelectedFile(file);
      setFileName(file.name);
      setUploadError(null);
      setUploadSuccess(null);
      setUploadProgress(0);
      toast({
        title: "File Selected",
        description: `${file.name} is ready to be uploaded.`,
      });
    } else {
      setSelectedFile(null);
      setFileName(null);
    }
  };

  const handleBrowseClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0); 

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("uploaderContext", "timetable"); // Specific context for timetables

      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 90) { 
             setUploadProgress(progress);
        } else {
            clearInterval(progressInterval)
        }
      }, 200);

      const response = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval); 
      setUploadProgress(100); 

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorToThrow;
        let parsedErrorData;
        if (contentType && contentType.includes("application/json")) {
          parsedErrorData = await response.json();
           const serverErrorMessage = (typeof parsedErrorData.error === 'object' && parsedErrorData.error !== null && 'message' in parsedErrorData.error) 
                                      ? (parsedErrorData.error as {message: string}).message 
                                      : (typeof parsedErrorData.error === 'string' ? parsedErrorData.error : "Unknown server error (JSON)");
          errorToThrow = new Error(serverErrorMessage || `Upload failed with status: ${response.status}`);
        } else {
          const errorText = await response.text();
          console.error("Server returned non-JSON error. Response text:", errorText);
          errorToThrow = new Error(`Upload failed: Server returned status ${response.status}. Response was not JSON. Check console for details.`);
        }
        throw errorToThrow;
      }

      const result = await response.json();
      setUploadSuccess(`Timetable "${selectedFile.name}" uploaded successfully! File ID: ${result.fileId}`);
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded.`,
      });
      
      setSelectedFile(null);
      setFileName(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
      }
      fetchAdminTimetables(); 
    } catch (error: any) {
      console.error("Upload error details (client-side catch):", error);
      let errorMessage = "An unexpected error occurred during upload.";
      if (error.message) {
        errorMessage = error.message;
      }
      
      setUploadError(errorMessage);
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setFileName(null);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }
  
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
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Upload Timetable</h1>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>New Timetable Upload</CardTitle>
          <CardDescription>
            Upload the latest college timetable in PDF format.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            className={cn(
              "flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg transition-colors",
              !isUploading && "cursor-pointer hover:border-primary border-muted",
              isUploading && "border-muted cursor-not-allowed opacity-70"
            )}
            onClick={handleBrowseClick}
            onDragOver={(e) => { if (!isUploading) e.preventDefault();}}
            onDrop={(e) => {
              if (isUploading) return;
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                if (file.type !== "application/pdf") {
                  toast({
                    title: "Invalid File Type",
                    description: "Only PDF files are allowed for timetables.",
                    variant: "destructive",
                  });
                  return;
                }
                setSelectedFile(file);
                setFileName(file.name);
                setUploadError(null);
                setUploadSuccess(null);
                toast({
                  title: "File Dropped",
                  description: `${file.name} is ready to be uploaded.`,
                });
              }
            }}
          >
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2 text-center">
              {isUploading ? "Uploading timetable..." : "Drag & drop PDF here, or click to browse."}
            </p>
            <Button variant="outline" onClick={(e) => {e.stopPropagation(); handleBrowseClick();}} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Browse PDF
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf" 
              disabled={isUploading}
            />
          </div>

          {fileName && (
            <div className="p-4 border rounded-lg bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileIcon className="h-5 w-5 text-red-500" />
                <p className="text-sm font-medium text-foreground">Selected: {fileName}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSelection} disabled={isUploading}>
                Clear
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">{uploadProgress}% uploaded</p>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-3 border rounded-md bg-green-50 border-green-200 text-green-700 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <p className="text-sm">{uploadSuccess}</p>
            </div>
          )}

          {uploadError && (
            <div className="p-3 border rounded-md bg-red-50 border-red-200 text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{uploadError}</p>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Uploading...' : 'Upload Timetable'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Uploaded Timetables</CardTitle>
            <CardDescription>List of currently active and past timetables.</CardDescription>
          </div>
           <Button variant="outline" size="icon" onClick={fetchAdminTimetables} disabled={isLoadingTimetables} aria-label="Refresh timetables">
              <RefreshCw className={cn("h-4 w-4", isLoadingTimetables && "animate-spin")} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingTimetables && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading timetables...</p>
            </div>
          )}
          {fetchTimetableError && !isLoadingTimetables && (
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{fetchTimetableError}</p>
            </div>
          )}
          {!isLoadingTimetables && !fetchTimetableError && adminTimetables.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No timetables have been uploaded yet.</p>
          )}
          {!isLoadingTimetables && !fetchTimetableError && adminTimetables.length > 0 && (
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
                  {adminTimetables.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell><FileIcon className="h-5 w-5 text-red-500" aria-label="PDF file" /></TableCell>
                      <TableCell className="font-medium max-w-[150px] sm:max-w-xs truncate" title={doc.originalFileName}>{doc.originalFileName}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatFileSize(doc.size)}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {doc.uploadedAt ? format(new Date(doc.uploadedAt), "PP pp") : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.downloadUrl} target="_blank" rel="noopener noreferrer" download={doc.originalFileName}>
                            <Download className="mr-1 sm:mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">View/Download</span>
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
