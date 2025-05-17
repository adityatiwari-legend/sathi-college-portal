
"use client"; 

import * as React from "react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FileText, UserCircle2, BookOpen, ListChecks, Save, Download as DownloadIcon, Loader2, ClipboardList } from "lucide-react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth"; 
import { auth, rtdb } from "@/lib/firebase/config"; 
import { Skeleton } from "@/components/ui/skeleton"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ref, set, get, child } from "firebase/database";

export default function UserDashboardPage() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [rtdbMessage, setRtdbMessage] = React.useState("");
  const [loadedRtdbMessage, setLoadedRtdbMessage] = React.useState<string | null>(null);
  const [isRtdbLoading, setIsRtdbLoading] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsLoading(false);
      if (user) {
        handleLoadFromRtdb(user); 
      }
    });
    return () => unsubscribe();
  }, []);

  const welcomeMessage = isLoading 
    ? <Skeleton className="h-6 w-3/4" />
    : currentUser?.displayName 
      ? `Welcome back, ${currentUser.displayName}!`
      : "Welcome to your Sathi College Portal.";

  const handleSaveToRtdb = async () => {
    if (!currentUser || !rtdb) {
      toast({ title: "Error", description: "User not authenticated or RTDB not available.", variant: "destructive" });
      return;
    }
    if (!rtdbMessage.trim()) {
      toast({ title: "Input Error", description: "Message cannot be empty.", variant: "destructive"});
      return;
    }
    setIsRtdbLoading(true);
    try {
      const userMessageRef = ref(rtdb, `userRtdbTestData/${currentUser.uid}/message`);
      await set(userMessageRef, rtdbMessage);
      toast({ title: "Success", description: "Message saved to Realtime Database!" });
      setRtdbMessage(""); 
    } catch (error: any) {
      console.error("Error saving to RTDB:", error);
      toast({ title: "RTDB Error", description: error.message || "Failed to save message.", variant: "destructive" });
    } finally {
      setIsRtdbLoading(false);
    }
  };

  const handleLoadFromRtdb = async (userToLoadFor?: User | null) => {
    const targetUser = userToLoadFor || currentUser;
    if (!targetUser || !rtdb) {
      if (!userToLoadFor) { 
          toast({ title: "Error", description: "User not authenticated or RTDB not available.", variant: "destructive" });
      }
      return;
    }
    setIsRtdbLoading(true);
    setLoadedRtdbMessage(null); 
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, `userRtdbTestData/${targetUser.uid}/message`));
      if (snapshot.exists()) {
        setLoadedRtdbMessage(snapshot.val());
        if (!userToLoadFor) { 
             toast({ title: "Success", description: "Message loaded from Realtime Database." });
        }
      } else {
        setLoadedRtdbMessage("No message found in RTDB.");
         if (!userToLoadFor) {
            toast({ title: "Info", description: "No message found for your user in RTDB." });
         }
      }
    } catch (error: any) {
      console.error("Error loading from RTDB:", error);
      setLoadedRtdbMessage("Failed to load message.");
      if (!userToLoadFor) {
        toast({ title: "RTDB Error", description: error.message || "Failed to load message.", variant: "destructive" });
      }
    } finally {
      setIsRtdbLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
        {isLoading ? (
          <Skeleton className="h-5 w-1/2" />
        ) : (
          <p className="text-muted-foreground">
            {welcomeMessage} Manage your documents and access college forms.
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              My Profile
            </CardTitle>
            <UserCircle2 className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View and manage your personal information and theme preferences.
            </p>
            <Link href="/user/dashboard/profile" className="text-sm font-medium text-primary hover:underline">
              View Profile &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              College Forms
            </CardTitle>
            <FileText className="h-6 w-6 text-accent" /> 
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Submit Admission, Course Registration, and other available forms.
            </p>
            {/* This link could go to a general forms listing page if you create one, or directly to admission if it's primary */}
            <Link href="/user/dashboard/forms/admission" className="text-sm font-medium text-primary hover:underline mr-2">
              Admission Form &rarr;
            </Link>
            <Link href="/user/dashboard/forms/course-registration" className="text-sm font-medium text-primary hover:underline mr-2">
              Course Reg. &rarr;
            </Link>
             <Link href="/user/dashboard/forms/custom-form" className="text-sm font-medium text-primary hover:underline">
              Custom Form &rarr;
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              My Activity
            </CardTitle>
            <ListChecks className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track your submitted forms and view shared documents.
            </p>
            <Link href="/user/dashboard/my-activity" className="text-sm font-medium text-primary hover:underline">
              View Activity &rarr;
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Realtime Database Test</CardTitle>
          <CardDescription>
            Test saving and loading a message to/from Firebase Realtime Database.
            Ensure your RTDB rules allow reads/writes for authenticated users under `userRtdbTestData/{'{userId}'}/message`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Enter a message"
              value={rtdbMessage}
              onChange={(e) => setRtdbMessage(e.target.value)}
              disabled={isRtdbLoading}
            />
            <Button onClick={handleSaveToRtdb} disabled={isRtdbLoading || !rtdbMessage.trim()}>
              {isRtdbLoading ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </div>
          <Button onClick={() => handleLoadFromRtdb()} variant="outline" disabled={isRtdbLoading}>
            {isRtdbLoading ? <Loader2 className="animate-spin" /> : <DownloadIcon className="h-4 w-4" />}
            Load Message
          </Button>
          {loadedRtdbMessage !== null && (
            <p className="text-sm text-muted-foreground p-3 border rounded-md bg-secondary">
              <strong>Loaded Message:</strong> {loadedRtdbMessage}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Notifications & Alerts</CardTitle>
          <CardDescription>
            Stay updated with important announcements and deadlines.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No new notifications at this time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
