
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { ArrowLeft, Save, UserCircle2, Image as ImageIcon, Loader2, AlertTriangle, CheckCircle, Palette } from "lucide-react";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { auth, rtdb } from "@/lib/firebase/config"; // Import rtdb
import { ref, set, get, child, onValue } from "firebase/database"; // Import RTDB functions

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50, { message: "Display name cannot exceed 50 characters." }).optional(),
  photoURL: z.string().url({ message: "Please enter a valid URL for the photo." }).optional().or(z.literal('')),
  email: z.string().email().optional(), // Email is mostly for display
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type ThemePreference = "light" | "dark" | "system";

export default function UserProfilePage() {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = React.useState(true);
  const [isSubmittingProfile, setIsSubmittingProfile] = React.useState(false);
  const [profileError, setProfileError] = React.useState<string | null>(null);
  const [profileSuccessMessage, setProfileSuccessMessage] = React.useState<string | null>(null);
  
  const [themePreference, setThemePreference] = React.useState<ThemePreference>("system");
  const [isSavingTheme, setIsSavingTheme] = React.useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      photoURL: "",
      email: "",
    },
  });

  React.useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        form.reset({
          displayName: currentUser.displayName || "",
          photoURL: currentUser.photoURL || "",
          email: currentUser.email || "",
        });

        // Fetch theme preference from RTDB
        if (rtdb) {
          const themePrefRef = ref(rtdb, `userPreferences/${currentUser.uid}/theme`);
          get(themePrefRef).then((snapshot) => {
            if (snapshot.exists()) {
              setThemePreference(snapshot.val() as ThemePreference);
            } else {
              setThemePreference("system"); // Default if not found
            }
          }).catch(error => {
            console.error("Error fetching theme preference:", error);
            toast({ title: "Error", description: "Could not load theme preference.", variant: "destructive" });
          });
        }

      } else {
        setUser(null);
      }
      setIsLoadingUser(false);
    });
    return () => unsubscribeAuth();
  }, [form]);

  async function onProfileSubmit(data: ProfileFormValues) {
    if (!user) {
      toast({ title: "Error", description: "No authenticated user found.", variant: "destructive" });
      return;
    }

    setIsSubmittingProfile(true);
    setProfileError(null);
    setProfileSuccessMessage(null);

    try {
      await updateProfile(user, {
        displayName: data.displayName || null,
        photoURL: data.photoURL || null,
      });
      setUser(auth.currentUser); 
      form.reset({ 
          displayName: auth.currentUser?.displayName || "",
          photoURL: auth.currentUser?.photoURL || "",
          email: auth.currentUser?.email || "",
      });
      setProfileSuccessMessage("Profile updated successfully!");
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved.",
      });
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setProfileError(err.message || "Failed to update profile. Please try again.");
      toast({
        title: "Update Failed",
        description: err.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingProfile(false);
    }
  }
  
  const handleThemeChange = async (newTheme: ThemePreference) => {
    if (!user || !rtdb) {
      toast({ title: "Error", description: "User not available or RTDB not configured.", variant: "destructive" });
      return;
    }
    setIsSavingTheme(true);
    setThemePreference(newTheme); // Optimistically update UI
    try {
      const themePrefRef = ref(rtdb, `userPreferences/${user.uid}/theme`);
      await set(themePrefRef, newTheme);
      toast({
        title: "Theme Preference Saved",
        description: `Your theme is set to ${newTheme}.`,
      });
    } catch (error) {
      console.error("Error saving theme preference to RTDB:", error);
      toast({
        title: "Error Saving Theme",
        description: "Could not save your theme preference. Please try again.",
        variant: "destructive",
      });
      // Revert optimistic update if save failed (optional, depends on desired UX)
      // For simplicity, we're not reverting here. Fetch on load will correct it.
    } finally {
      setIsSavingTheme(false);
    }
  };


  if (isLoadingUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-7 w-1/3 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center mb-6">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
             <div className="mt-4 space-y-2">
                <Skeleton className="h-5 w-32" />
                <div className="flex space-x-4">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-24" />
                </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Skeleton className="h-10 w-28" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user && !isLoadingUser) {
     return (
      <div className="space-y-6 text-center">
         <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
                <p>You must be logged in to view this page.</p>
                <Button asChild className="mt-4">
                    <Link href="/login">Go to Login</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
     )
  }
  
  const getAvatarFallback = (name?: string | null) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/user/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        </div>
      </div>

      <Card className="shadow-lg max-w-2xl mx-auto">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onProfileSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle2 className="h-7 w-7 text-primary" />
                Edit Your Profile
              </CardTitle>
              <CardDescription>
                Update your display name and profile picture URL. Your email address cannot be changed here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center mb-6">
                <Avatar className="h-24 w-24 text-3xl">
                  <AvatarImage src={form.watch("photoURL") || user?.photoURL || undefined} alt={form.watch("displayName") || user?.displayName || "User"} data-ai-hint="user avatar"/>
                  <AvatarFallback>
                    {getAvatarFallback(form.watch("displayName") || user?.displayName)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {profileSuccessMessage && (
                <div className="p-3 border rounded-md bg-green-50 border-green-200 text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm">{profileSuccessMessage}</p>
                </div>
              )}
              {profileError && (
                <div className="p-3 border rounded-md bg-red-50 border-red-200 text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">{profileError}</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input {...field} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Name" {...field} disabled={isSubmittingProfile || isSavingTheme}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" /> Profile Photo URL
                    </FormLabel>
                    <FormControl>
                      <Input type="url" placeholder="https://example.com/your-photo.jpg" {...field} disabled={isSubmittingProfile || isSavingTheme}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isSubmittingProfile || isSavingTheme || !form.formState.isDirty}>
                {isSubmittingProfile ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSubmittingProfile ? "Saving..." : "Save Profile Changes"}
              </Button>
            </CardFooter>
          </form>
        </Form>

        <CardHeader className="border-t mt-6">
            <CardTitle className="flex items-center gap-2">
                <Palette className="h-6 w-6 text-primary" />
                Theme Preference
            </CardTitle>
            <CardDescription>
                Choose your preferred theme for the portal. This setting is saved in real-time.
            </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
             <RadioGroup
                onValueChange={(value) => handleThemeChange(value as ThemePreference)}
                value={themePreference}
                className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                disabled={isSubmittingProfile || isSavingTheme}
              >
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="light" id="theme-light" />
                  </FormControl>
                  <FormLabel htmlFor="theme-light" className="font-normal">
                    Light
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="dark" id="theme-dark" />
                  </FormControl>
                  <FormLabel htmlFor="theme-dark" className="font-normal">
                    Dark
                  </FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <RadioGroupItem value="system" id="theme-system" />
                  </FormControl>
                  <FormLabel htmlFor="theme-system" className="font-normal">
                    System
                  </FormLabel>
                </FormItem>
              </RadioGroup>
              {isSavingTheme && <p className="text-sm text-muted-foreground flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving theme...</p>}
        </CardContent>

      </Card>
    </div>
  );
}


    