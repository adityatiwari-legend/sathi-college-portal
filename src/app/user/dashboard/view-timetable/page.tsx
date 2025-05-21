
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export default function UserViewTimetablePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/user/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">View Academic Timetable (Simplified)</h1>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Timetable</CardTitle>
          <CardDescription>
            This is a placeholder for the View Timetable page. If you see this, the route is working.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The actual timetable content will be loaded here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
