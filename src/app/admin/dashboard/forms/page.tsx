
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, FileText, BookOpen, Users, PlusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ManageFormsPage() {
  const handleCreateNewForm = () => {
    toast({
      title: "Feature Coming Soon!",
      description: "The ability to dynamically create new form types is under development.",
    });
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
          <h1 className="text-3xl font-bold tracking-tight">Manage College Forms</h1>
        </div>
        <Button onClick={handleCreateNewForm}>
          <PlusCircle className="mr-2 h-5 w-5" />
          Create New Form Type
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Form Types Overview</CardTitle>
          <CardDescription>
            Configure existing form types or create new ones.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Admission Forms
              </CardTitle>
              <Users className="h-6 w-6 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure the title, description, and active status for admission applications.
              </p>
              <Button asChild variant="outline">
                <Link href="/admin/dashboard/forms/admission">
                  Configure Admission Forms &rarr;
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">
                Course Registration Forms
              </CardTitle>
              <BookOpen className="h-6 w-6 text-accent" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Set up and manage course registration periods and settings.
              </p>
              <Button asChild variant="outline">
                <Link href="/admin/dashboard/forms/course-registration">
                  Configure Course Registrations &rarr;
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Placeholder for other form types if any */}
        </CardContent>
      </Card>

       <Card className="mt-6">
        <CardHeader>
            <CardTitle>Dynamic Form Builder (Coming Soon)</CardTitle>
            <CardDescription>
                Future functionality will allow you to design custom forms with various field types, validation rules, and workflows directly within this panel.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
                Imagine creating surveys, feedback forms, event registrations, and more, all tailored to Sathi College&apos;s needs.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
