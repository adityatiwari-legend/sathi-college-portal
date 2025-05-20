
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LogIn, Loader2, User, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signInWithPopup, User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth, googleAuthProvider, firebaseConfig } from "@/lib/firebase/config";
import Image from "next/image"; 

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password cannot be empty." }),
  role: z.enum(["user", "admin"], {
    required_error: "You need to select a role.",
  }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const ADMIN_EMAIL = "admin@sathi.com";
const ADMIN_PASSWORD = "adminpassword";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  React.useEffect(() => {
    console.log("LoginPage: useEffect for onAuthStateChanged running to check initial auth state.");
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("LoginPage: onAuthStateChanged - An active user session exists:", user.uid, "Will NOT redirect automatically.");
      } else {
        console.log("LoginPage: onAuthStateChanged - No active user session found.");
      }
      setIsCheckingAuth(false);
      console.log("LoginPage: isCheckingAuth set to false, form should be visible.");
    });

    return () => {
      console.log("LoginPage: Cleaning up onAuthStateChanged subscription.");
      unsubscribe();
    };
  }, []);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "user",
    },
  });

  const handleLoginSuccess = (firebaseUser: FirebaseUser, role: "user" | "admin") => {
    console.log(`Logged in ${role}: ${firebaseUser.uid}`);
    toast({
      title: "Login Successful",
      description: `Welcome back! Redirecting to ${role} dashboard.`,
    });
    router.push(role === "admin" ? '/admin/dashboard' : '/user/dashboard');
  };
  
  const handleAuthError = (error: any, context: "Login" | "Google Sign-In") => {
    console.error(`${context} error details:`, error, "Firebase config:", firebaseConfig);
    let errorMessage = "An unexpected error occurred. Please try again.";
    if (error.code) {
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "Invalid email or password for user account.";
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
    console.log("Login attempt with role:", data.role, "and email:", data.email);

    if (data.role === "admin") {
      if (data.email === ADMIN_EMAIL && data.password === ADMIN_PASSWORD) {
        console.log("Admin login successful for:", data.email);
        const mockAdminUser = { uid: "admin_sathi", email: ADMIN_EMAIL } as FirebaseUser;
        handleLoginSuccess(mockAdminUser, "admin");
        setIsLoading(false);
        return;
      } else {
        console.log("Admin login failed for:", data.email);
        toast({
          title: "Admin Login Failed",
          description: "Invalid admin credentials.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    console.log("Attempting Firebase Email/Password Sign In for user with config:", firebaseConfig);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      handleLoginSuccess(userCredential.user, "user");
    } catch (error) {
      handleAuthError(error, "Login");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    const selectedRole = form.getValues("role"); 
    if (!selectedRole) {
        toast({
            title: "Role Not Selected",
            description: "Please select a role (User or Admin) before signing in with Google.",
            variant: "destructive"
        });
        return;
    }

    if (selectedRole === "admin") {
        toast({
            title: "Admin Login Method",
            description: "Admin login requires specific email and password. Google Sign-In is for user accounts only.",
            variant: "info"
        });
        return;
    }

    setIsGoogleLoading(true);
    console.log("Attempting Firebase Google Sign In for user role with config:", firebaseConfig);
    try {
      const userCredential = await signInWithPopup(auth, googleAuthProvider);
      handleLoginSuccess(userCredential.user, "user");
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
             <Image 
                src="https://icon2.cleanpng.com/20180627/vy/aayjnkno0.webp" 
                alt="Sathi College Portal Logo" 
                width={64} 
                height={64}
                data-ai-hint="university logo"
              />
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
                    <div className="flex justify-between items-baseline">
                      <FormLabel>Password</FormLabel>
                      <Link href="/forgot-password" passHref legacyBehavior>
                        <a className="text-sm font-medium text-primary hover:underline">
                          Forgot password?
                        </a>
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} disabled={isLoading || isGoogleLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Select Role</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                        disabled={isLoading || isGoogleLoading}
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="user" id="role-user" />
                          </FormControl>
                          <FormLabel htmlFor="role-user" className="font-normal flex items-center">
                            <User className="mr-2 h-4 w-4 text-muted-foreground" /> User
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="admin" id="role-admin" />
                          </FormControl>
                          <FormLabel htmlFor="role-admin" className="font-normal flex items-center">
                            <Shield className="mr-2 h-4 w-4 text-muted-foreground" /> Admin
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
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
            Sign in with Google (as User)
          </Button>
          <div className="mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
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
