
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Mail, Building2, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

const forgotPasswordFormSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [messageSent, setMessageSent] = React.useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true);
    setMessageSent(false);
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({
        title: "Password Reset Email Sent",
        description: "If an account exists for this email, a password reset link has been sent.",
      });
      setMessageSent(true);
      form.reset(); 
    } catch (error: any) {
      console.error("Forgot password error:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
            // We don't want to reveal if an email exists or not for security reasons
            // So, we show a generic success message.
            errorMessage = "If an account exists for this email, a password reset link has been sent.";
            setMessageSent(true); // Treat as success from user's perspective
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/missing-email':
             errorMessage = 'Please provide an email address.';
             break;
          case "auth/network-request-failed":
            errorMessage = "Network error. Please check your internet connection.";
            break;
          default:
            errorMessage = error.message || `Failed to send reset email: ${error.code || 'Unknown error'}.`;
        }
      }
       if (!messageSent) { // Only show error toast if not handled as a "success" (like user-not-found)
        toast({
          title: "Error Sending Email",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
             <Building2 className="h-8 w-8" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight">Forgot Password</CardTitle>
          <CardDescription className="text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messageSent ? (
            <div className="space-y-4 text-center">
              <p className="text-foreground">
                If an account exists for the email provided, a password reset link has been sent. Please check your inbox (and spam folder).
              </p>
              <Button asChild variant="outline">
                <Link href="/login">Back to Login</Link>
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="your.email@example.com" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-3 text-base" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
                  Send Reset Link
                </Button>
              </form>
            </Form>
          )}
           {!messageSent && (
            <div className="mt-6 text-center text-sm">
              Remember your password?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </div>
           )}
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
