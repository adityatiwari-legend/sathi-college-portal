
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { UserRound, ShieldCheck, LogIn, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, UserCredential } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

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

  const handleLoginSuccess = (userCredential: UserCredential, role: "user" | "admin") => {
    toast({
      title: "Login Successful",
      description: `Welcome ${userCredential.user.email}! Role: ${role}.`,
    });
    if (role === "admin") {
      router.push('/admin/dashboard');
    } else {
      router.push('/user/dashboard');
    }
  };

  const handleLoginError = (error: any, method: string) => {
    console.error(`${method} error:`, error);
    toast({
      title: "Login Failed",
      description: error.message || `An error occurred during ${method}.`,
      variant: "destructive",
    });
  };

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      handleLoginSuccess(userCredential, data.role);
    } catch (error) {
      handleLoginError(error, "email/password login");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      // Use the role currently selected in the form for redirection
      const selectedRole = form.getValues("role"); 
      handleLoginSuccess(userCredential, selectedRole);
    } catch (error: any) {
      // Handle specific Google OAuth errors if necessary
      if (error.code === 'auth/popup-closed-by-user') {
        toast({
          title: "Login Canceled",
          description: "Google Sign-In was canceled.",
          variant: "default",
        });
      } else {
        handleLoginError(error, "Google Sign-In");
      }
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
                {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <LogIn className="mr-2 h-5 w-5" />
                )}
                 Sign In
              </Button>
            </form>
          </Form>
          <Separator className="my-6" />
          <Button variant="outline" className="w-full font-semibold py-3 text-base" onClick={handleGoogleLogin} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                <Image src="/google-logo.svg" alt="Google logo" width={20} height={20} className="mr-2" data-ai-hint="google logo" />
            )}
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
