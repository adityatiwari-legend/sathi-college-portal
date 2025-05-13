
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, UploadCloud, FileUp, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/config"; 
import type { User } from "firebase/auth";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";


export default function UserUploadDocumentPage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = React.useState<string | null>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      if (!user) {
        toast({
            title: "Not Logged In",
            description: "Please log in to upload documents.",
            variant: "destructive",
        });
        // Optionally redirect to login if not authenticated
        // router.push('/login'); 
      }
    });
    return () => unsubscribe();
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

    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload files.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    setUploadProgress(0); 

    try {
      const idToken = await currentUser.getIdToken(true);
      const formData = new FormData();
      formData.append("file", selectedFile);

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
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      clearInterval(progressInterval); 
      setUploadProgress(100); 

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed with status: ${response.status}`);
      }

      const result = await response.json();
      setUploadSuccess(`File "${selectedFile.name}" uploaded successfully! File ID: ${result.fileId}`);
      toast({
        title: "Upload Successful",
        description: `${selectedFile.name} has been uploaded.`,
      });
      // Optionally reset after successful upload
      // setSelectedFile(null);
      // setFileName(null);
      // if(fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      console.error("Upload error:", error);
      setUploadError(error.message || "An unexpected error occurred during upload.");
      toast({
        title: "Upload Failed",
        description: error.message || "Could not upload file.",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard"> 
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Upload Your Document</h1>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
          <CardDescription>
            Upload your documents here. Ensure you are logged in.
            Supported formats: PDF, DOC, DOCX, JPG, PNG. Max 5MB.
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
            onDragOver={(e) => { if (!isUploading && currentUser) e.preventDefault();}} // Allow drag only if logged in
            onDrop={(e) => {
              if (isUploading || !currentUser) return; // Prevent drop if uploading or not logged in
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
              {isUploading ? "Uploading..." : (currentUser ? "Drag and drop files here or click to browse." : "Please log in to enable uploads.")}
            </p>
            <Button variant="outline" onClick={(e) => {e.stopPropagation(); handleBrowseClick();}} disabled={isUploading || !currentUser}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Browse File
            </Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
              disabled={isUploading || !currentUser}
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
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading || !currentUser}>
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileUp className="mr-2 h-4 w-4" />
              )}
              {isUploading ? 'Uploading...' : 'Upload Selected File'}
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mt-6 mb-2">Important Notes:</h3>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 text-sm">
              <li>Ensure documents are legible and complete before uploading.</li>
              <li>You can track your uploaded documents through your dashboard once implemented.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
