
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, UploadCloud } from "lucide-react";

export default function UploadDocumentPage() {
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
      
      <Card>
        <CardHeader>
          <CardTitle>Document Upload Center</CardTitle>
          <CardDescription>
            Use this section to upload various documents required for college processes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-muted rounded-lg">
            <UploadCloud className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Drag and drop files here or click to browse.</p>
            <Button variant="outline">Browse Files (Coming Soon)</Button>
          </div>
          
          <p className="text-muted-foreground">
            Placeholder content for document uploads. Future functionality will include:
          </p>
          <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
            <li>Support for various file types (PDF, DOCX, JPG, PNG).</li>
            <li>File validation and size limits.</li>
            <li>Categorization of uploaded documents.</li>
            <li>Linking documents to student profiles or specific forms.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
