
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// This page is now effectively deprecated in favor of separate pages.
export default function MyActivityDeprecatedPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/user/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">My Activity (Old)</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6 text-primary" />
            Page Reorganized
          </CardTitle>
          <CardDescription>
            This "My Activity" page has been reorganized.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            Your submitted forms and shared documents are now available on separate, dedicated pages for better clarity.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
                <Link href="/user/dashboard/my-submitted-forms">
                Go to My Submitted Forms
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/user/dashboard/documents">
                Go to Shared Documents
                </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
