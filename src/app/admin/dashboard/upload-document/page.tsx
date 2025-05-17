
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, UploadCloud, FileUp, CheckCircle, AlertTriangle, Loader2, FileIcon, Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface UploadedAdminDocument {
  id: string;
  originalFileName: string;
  downloadUrl: string;
  contentType: string;
  size: number;
  uploadedAt: string | null; // ISO string from API
  uploaderContext: string;
}

export default function AdminUploadDocumentPage() { 
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);

  const [adminDocuments, setAdminDocuments] = React.useState<UploadedAdminDocument[]>([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = React.useState(true);
  const [fetchDocError, setFetchDocError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchAdminDocuments = async () => {
    setIsLoadingDocuments(true);
    setFetchDocError(null);
    try {
      const response = await fetch("/api/admin/list-documents");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch documents: ${response.statusText}`);
      }
      const data: UploadedAdminDocument[] = await response.json();
      setAdminDocuments(data);
    } catch (error: any) {
      console.error("Error fetching admin documents:", error);
      setFetchDocError(error.message || "Could not load admin documents.");
      toast({ title: "Error Loading Documents", description: error.message, variant: "destructive" });
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  React.useEffect(() => {
    fetchAdminDocuments();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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
        description: "Please select a file to upload.",
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
      formData.append("uploaderContext", "admin");

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
          const serverErrorMessage = (typeof parsedErrorData.error === 'object' && parsedErrorData.error !== null && parsedErrorData.error.message) 
                                      ? parsedErrorData.error.message 
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
      setUploadSuccess(`File "${selectedFile.name}" uploaded successfully! File ID: ${result.fileId}`);
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
      fetchAdminDocuments(); // Refresh the list of documents
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
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">(Admin) Upload & Manage Documents</h1>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Document Upload Center</CardTitle>
          <CardDescription>
            Upload new documents to be shared with users.
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
            <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2 text-center">
              {isUploading ? "Uploading..." : "Drag and drop files here or click to browse."}
            </p>
            <Button variant="outline" onClick={(e) => {e.stopPropagation(); handleBrowseClick();}} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Browse File
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
              disabled={isUploading}
            />
          </div>

          {fileName && (
            <div className="p-4 border rounded-lg bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
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
              {isUploading ? 'Uploading...' : 'Upload Selected File'}
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mt-6 mb-2">Supported Formats & Guidelines:</h3>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 text-sm">
              <li>Supported file types: PDF, DOC, DOCX, JPG, JPEG, PNG.</li>
              <li>Maximum file size: 5MB (example limit, actual limit may vary).</li>
              <li>Ensure documents are legible and complete.</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Uploaded Admin Documents</CardTitle>
            <CardDescription>List of documents uploaded by administrators.</CardDescription>
          </div>
           <Button variant="outline" size="icon" onClick={fetchAdminDocuments} disabled={isLoadingDocuments} aria-label="Refresh documents">
              <RefreshCw className={cn("h-4 w-4", isLoadingDocuments && "animate-spin")} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingDocuments && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading documents...</p>
            </div>
          )}
          {fetchDocError && !isLoadingDocuments && (
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{fetchDocError}</p>
            </div>
          )}
          {!isLoadingDocuments && !fetchDocError && adminDocuments.length === 0 && (
            <p className="text-center text-muted-foreground py-10">No documents have been uploaded by admins yet.</p>
          )}
          {!isLoadingDocuments && !fetchDocError && adminDocuments.length > 0 && (
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
                  {adminDocuments.map((doc) => (
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
