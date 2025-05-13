
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { UserRound, ShieldCheck, LogIn, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
// Firebase imports removed: signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, auth

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
  password: z.string().min(1, { message: "Password is required." }), // Simplified password validation
  role: z.enum(["user", "admin"], { required_error: "Please select a role." }),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function LoginPage() {
  const router = useRouter();
  // isLoading and isGoogleLoading states removed as Firebase calls are removed

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "user",
    },
  });

  const handleLoginSuccess = (role: "user" | "admin") => {
    toast({
      title: "Login Action Triggered", // Updated toast message
      description: `Redirecting to ${role} dashboard.`,
    });
    if (role === "admin") {
      router.push('/admin/dashboard');
    } else {
      router.push('/user/dashboard');
    }
  };

  // handleLoginError removed as Firebase errors are no longer applicable here

  async function onSubmit(data: LoginFormValues) {
    // setIsLoading(true); // Removed
    // No Firebase call, directly proceed with redirection logic
    handleLoginSuccess(data.role);
    // setIsLoading(false); // Removed
  }

  async function handleGoogleLogin() {
    // setIsGoogleLoading(true); // Removed
    // No Firebase Google Sign-In, directly proceed with redirection based on selected role
    const selectedRole = form.getValues("role"); 
    handleLoginSuccess(selectedRole);
    // setIsGoogleLoading(false); // Removed
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
                      <Input type="email" placeholder="your.email@example.com" {...field} />
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
                      <Input type="password" placeholder="••••••••" {...field} />
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
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="user" id="role-user" />
                          </FormControl>
                          <FormLabel htmlFor="role-user" className="font-normal flex items-center gap-2 cursor-pointer">
                            <UserRound className="h-5 w-5 text-muted-foreground" />
                            User
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="admin" id="role-admin" />
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
               <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 text-base">
                {/* Loading spinner removed */}
                <LogIn className="mr-2 h-5 w-5" />
                Sign In
              </Button>
            </form>
          </Form>
          <Separator className="my-6" />
          <Button variant="outline" className="w-full font-semibold py-3 text-base" onClick={handleGoogleLogin}>
            {/* Loading spinner removed */}
            <Image src="/google-logo.svg" alt="Google logo" width={20} height={20} className="mr-2" data-ai-hint="google logo" />
            Continue with Google {/* Changed text to reflect it's not actual Google Sign-In anymore */}
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
