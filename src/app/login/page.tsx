
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { UserRound, ShieldCheck, LogIn, Building2, Loader2 } from "lucide-react"; // Added Loader2
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword, signInWithPopup, User } from "firebase/auth"; // Firebase imports
import { auth, googleAuthProvider } from "@/lib/firebase/config"; // Firebase config

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

const loginFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["user", "admin"], { required_error: "Please select a role." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "user",
    },
  });

  const handleLoginSuccess = (user: User, role: "user" | "admin") => {
    // You might want to store user info or token here (e.g., in context or state management)
    console.log("Logged in user:", user);
    toast({
      title: "Login Successful",
      description: `Welcome! Redirecting to ${role} dashboard.`,
    });
    if (role === "admin") {
      router.push('/admin/dashboard');
    } else {
      router.push('/user/dashboard');
    }
  };

  const handleLoginError = (error: any) => {
    console.error("Login error:", error);
    let errorMessage = "An unexpected error occurred. Please try again.";
    if (error.code) {
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
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
        default:
          errorMessage = error.message || "Login failed. Please try again.";
      }
    }
    toast({
      title: "Login Failed",
      description: errorMessage,
      variant: "destructive",
    });
  };

  async function onSubmit(data: LoginFormValues) {
    if (!auth) {
        toast({ title: "Firebase Error", description: "Firebase is not configured. Please check environment variables.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      handleLoginSuccess(userCredential.user, data.role);
    } catch (error) {
      handleLoginError(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    if (!auth || !googleAuthProvider) {
        toast({ title: "Firebase Error", description: "Firebase is not configured for Google Sign-In. Please check environment variables.", variant: "destructive" });
        return;
    }
    setIsGoogleLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleAuthProvider);
      const selectedRole = form.getValues("role"); // Role selection still applies
      handleLoginSuccess(userCredential.user, selectedRole);
    } catch (error) {
      handleLoginError(error);
    } finally {
      setIsGoogleLoading(false);
    }
  }


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
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Select Your Role</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-4 pt-1"
                        disabled={isLoading || isGoogleLoading}
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="user" id="role-user" disabled={isLoading || isGoogleLoading} />
                          </FormControl>
                          <FormLabel htmlFor="role-user" className="font-normal flex items-center gap-2 cursor-pointer">
                            <UserRound className="h-5 w-5 text-muted-foreground" />
                            User
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="admin" id="role-admin" disabled={isLoading || isGoogleLoading} />
                          </FormControl>
                          <FormLabel htmlFor="role-admin" className="font-normal flex items-center gap-2 cursor-pointer">
                            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                            Administrator
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
            {isGoogleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Image src="/google-logo.svg" alt="Google logo" width={20} height={20} className="mr-2" data-ai-hint="google logo" />}
            Sign in with Google
          </Button>
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
