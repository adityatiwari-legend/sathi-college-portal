
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info } from "lucide-react";

export default function UserUploadDocumentDeprecatedPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/user/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Upload Document</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6 text-primary" />
            Page Information
          </CardTitle>
          <CardDescription>
            This page is for informational purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The document upload functionality for users has been moved. Users can now view documents shared by administrators in the "Shared Documents" section.
          </p>
          <Button asChild className="mt-4">
            <Link href="/user/dashboard/documents">
              Go to Shared Documents
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
