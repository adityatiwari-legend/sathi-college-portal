
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// This page is now effectively deprecated in favor of /user/dashboard/my-activity
export default function UserSharedDocumentsDeprecatedPage() {
  return (
    <div className="space-y-6">
       <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/user/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Shared Documents (Old)</h1>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6 text-primary" />
            Page Moved
          </CardTitle>
          <CardDescription>
            This page is no longer the primary location for shared documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You can find shared documents along with your submitted forms on the "My Activity" page.
          </p>
          <Button asChild className="mt-4">
            <Link href="/user/dashboard/my-activity">
              Go to My Activity
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
