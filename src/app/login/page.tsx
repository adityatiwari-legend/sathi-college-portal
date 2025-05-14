
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LogIn, Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword, signInWithPopup, User, onAuthStateChanged } from "firebase/auth";
import { auth, googleAuthProvider, firebaseConfig } from "@/lib/firebase/config";

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
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password cannot be empty." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    console.log("LoginPage: useEffect for onAuthStateChanged running to check initial auth state.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // We still want to know if a user session exists for debugging or potential future logic,
      // but we won't automatically redirect from this page based on it.
      if (user) {
        console.log("LoginPage: onAuthStateChanged - An active user session exists:", user.uid);
      } else {
        console.log("LoginPage: onAuthStateChanged - No active user session found.");
      }
      // Regardless of user state, we stop checking and allow the form to render.
      // The actual login action is initiated by user interaction.
      setIsCheckingAuth(false);
      console.log("LoginPage: isCheckingAuth set to false, form should be visible.");
    });

    // Cleanup subscription on component unmount
    return () => {
      console.log("LoginPage: Cleaning up onAuthStateChanged subscription.");
      unsubscribe();
    };
  }, [router]); // Keep router in dependency array if other parts of the effect might use it,
                // or if router instance changes should trigger re-subscription.

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleAuthError = (error: any, context: "Login" | "Google Sign-In") => {
    console.error(`${context} error details:`, error);
    let errorMessage = "An unexpected error occurred. Please try again.";
    if (error.code) {
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/too-many-requests":
            errorMessage = "Too many login attempts. Please try again later.";
            break;
        case "auth/popup-closed-by-user":
            errorMessage = "Google Sign-In popup closed. Please try again.";
            break;
        case "auth/network-request-failed":
            errorMessage = "Network error. Please check your internet connection.";
            break;
        case "auth/configuration-not-found":
             errorMessage = `Firebase Authentication configuration error (${context}). Please check Firebase project settings. (auth/configuration-not-found)`;
             break;
        default:
          errorMessage = error.message || `${context} failed: ${error.code || 'Unknown error'}. Please try again.`;
      }
    }
    toast({
      title: `${context} Failed`,
      description: errorMessage,
      variant: "destructive",
    });
  };

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    console.log("Attempting Firebase Email/Password Sign In with config:", firebaseConfig); // Use firebaseConfig directly if imported
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      console.log("Logged in user:", userCredential.user.uid);
      toast({
        title: "Login Successful",
        description: `Welcome back! Redirecting to your dashboard.`,
      });
      router.push('/user/dashboard'); // Redirect after successful login
    } catch (error) {
      handleAuthError(error, "Login");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    console.log("Attempting Firebase Google Sign In with config:", firebaseConfig); // Use firebaseConfig directly if imported
    try {
      const userCredential = await signInWithPopup(auth, googleAuthProvider);
      console.log("Logged in user (Google):", userCredential.user.uid);
      toast({
        title: "Login Successful",
        description: `Welcome! Redirecting to your dashboard.`,
      });
      router.push('/user/dashboard'); // Redirect after successful login
    } catch (error) {
      handleAuthError(error, "Google Sign-In");
    } finally {
      setIsGoogleLoading(false);
    }
  }

  if (isCheckingAuth) {
    console.log("LoginPage: Rendering loader because isCheckingAuth is true.");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-2">Checking authentication...</p>
      </div>
    );
  }
  console.log("LoginPage: Rendering login form because isCheckingAuth is false.");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
             <Building2 className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Sathi Login</CardTitle>
          <CardDescription className="text-muted-foreground">
            Sign in to access your Sathi account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} disabled={isLoading || isGoogleLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 text-base" disabled={isLoading || isGoogleLoading}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                Sign In
              </Button>
            </form>
          </Form>
          <Separator className="my-6" />
          <Button variant="outline" className="w-full font-semibold py-3 text-base" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Image src="/google-logo.svg" alt="Google logo" width={20} height={20} className="mr-2" data-ai-hint="google logo"/>}
            Sign in with Google
          </Button>
          <div className="mt-6 text-center text-sm">
            Don't have an account?{" "}
            <Link href="/signup" className="font-medium text-primary hover:underline">
              Sign Up
            </Link>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sathi College Portal. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
