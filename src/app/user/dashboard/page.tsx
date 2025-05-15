
"use client"; 

import * as React from "react"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FileText, Files, UserCircle2, BookOpen, Users as UsersIcon, Save, Download as DownloadIcon, Loader2 } from "lucide-react";
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
        // Optionally load initial RTDB message on auth change
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
      setRtdbMessage(""); // Clear input after saving
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
      if (!userToLoadFor) { // Only show toast if manually triggered by button click
          toast({ title: "Error", description: "User not authenticated or RTDB not available.", variant: "destructive" });
      }
      return;
    }
    setIsRtdbLoading(true);
    setLoadedRtdbMessage(null); // Clear previous message
    try {
      const dbRef = ref(rtdb);
      const snapshot = await get(child(dbRef, `userRtdbTestData/${targetUser.uid}/message`));
      if (snapshot.exists()) {
        setLoadedRtdbMessage(snapshot.val());
        if (!userToLoadFor) { // Only show toast if manually triggered
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
              Admission Form
            </CardTitle>
            <UsersIcon className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Apply for admission to Sathi College.
            </p>
            <Link href="/user/dashboard/forms/admission" className="text-sm font-medium text-primary hover:underline">
              Go to Admission Form &rarr;
            </Link>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Course Registration
            </CardTitle>
            <BookOpen className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Register for courses for the upcoming academic term.
            </p>
            <Link href="/user/dashboard/forms/course-registration" className="text-sm font-medium text-primary hover:underline">
              Register for Courses &rarr;
            </Link>
          </CardContent>
        </Card>

        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Shared Documents
            </CardTitle>
            <Files className="h-6 w-6 text-accent" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Access documents shared by the administration.
            </p>
            <Link href="/user/dashboard/documents" className="text-sm font-medium text-primary hover:underline">
              View Documents &rarr;
            </Link>
          </CardContent>
        </Card>

         <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 opacity-70 cursor-not-allowed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              My Submitted Forms
            </CardTitle>
            <FileText className="h-6 w-6 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track the status of your admission, course registration, and other submitted forms. (Coming Soon)
            </p>
             <span className="text-sm font-medium text-muted-foreground/80 cursor-not-allowed" aria-disabled="true">
              View My Forms &rarr;
            </span>
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

