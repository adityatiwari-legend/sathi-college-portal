
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Info, ListChecks, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function MyActivityPlaceholderPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/user/dashboard">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to User Dashboard</span>
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">My Activity</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-6 w-6 text-primary" />
            Activity Hub Update
          </CardTitle>
          <CardDescription>
            Your activities are now organized into dedicated sections for easier access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            To view your submitted forms or documents shared by the administration, please use the links below or the sidebar navigation.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <ListChecks className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">My Submitted Forms</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Track the status and details of all forms you've submitted.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/user/dashboard/my-submitted-forms">
                  Go to My Submitted Forms &rarr;
                </Link>
              </Button>
            </Card>
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-2">
                <Download className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Shared Documents</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Access documents and timetables shared by the college.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/user/dashboard/documents">
                  Go to Shared Documents &rarr;
                </Link>
              </Button>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
