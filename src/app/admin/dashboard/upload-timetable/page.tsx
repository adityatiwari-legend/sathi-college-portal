
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminUploadTimetablePlaceholderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Upload Timetable (Placeholder)</h1>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Timetable Upload Section</CardTitle>
          <CardDescription>
            This page is for uploading and managing timetables.
            If you see this, the basic routing to this page is working.
            The previous complex content has been temporarily replaced for debugging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is a placeholder for the timetable upload and management functionality.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
