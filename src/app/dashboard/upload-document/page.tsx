
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, UploadCloud, FileUp, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input"; // Input will be used for file input
import { toast } from "@/hooks/use-toast";

export default function UploadDocumentPage() {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
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
    fileInputRef.current?.click();
  };

  const handleUpload = () => {
    if (selectedFile) {
      // Placeholder for actual upload logic
      toast({
        title: "Upload Initiated (Placeholder)",
        description: `Uploading ${selectedFile.name}... This is a placeholder and no actual upload will occur.`,
      });
      // Reset after "upload"
      // setSelectedFile(null);
      // setFileName(null);
    } else {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Upload Document</h1>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Document Upload Center</CardTitle>
          <CardDescription>
            Use this section to upload various documents required for college processes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div 
            className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-muted rounded-lg cursor-pointer hover:border-primary transition-colors"
            onClick={handleBrowseClick}
            onDragOver={(e) => e.preventDefault()} // Basic drag over prevention
            onDrop={(e) => { // Basic drop handling
              e.preventDefault();
              const file = e.dataTransfer.files?.[0];
              if (file) {
                setSelectedFile(file);
                setFileName(file.name);
                toast({
                  title: "File Dropped",
                  description: `${file.name} is ready to be uploaded.`,
                });
              }
            }}
          >
            <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2 text-center">
              Drag and drop files here or click to browse.
            </p>
            <Button variant="outline" onClick={(e) => {e.stopPropagation(); handleBrowseClick();}}>Browse File</Button>
            <Input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
            />
          </div>

          {fileName && (
            <div className="p-4 border rounded-lg bg-muted/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm font-medium text-foreground">Selected: {fileName}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedFile(null); setFileName(null); if(fileInputRef.current) fileInputRef.current.value = ""; }}>
                Clear
              </Button>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} disabled={!selectedFile}>
              <FileUp className="mr-2 h-4 w-4" />
              Upload Selected File (Coming Soon)
            </Button>
          </div>

          <div>
            <h3 className="font-semibold mt-6 mb-2">Supported Formats & Guidelines:</h3>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1 text-sm">
              <li>Supported file types: PDF, DOC, DOCX, JPG, JPEG, PNG.</li>
              <li>Maximum file size: 5MB (example limit).</li>
              <li>Ensure documents are legible and complete.</li>
              <li>Categorization of uploaded documents will be available soon.</li>
              <li>Linking documents to student profiles or specific forms will be implemented later.</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
