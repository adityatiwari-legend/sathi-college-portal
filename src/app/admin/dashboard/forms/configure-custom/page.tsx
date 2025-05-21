
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Save, PlusCircle, XCircle, Loader2, AlertTriangle, CheckCircle, Text, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

const CUSTOM_FORM_ID = "mainGlobalCustomForm";

const fieldSchema = z.object({
  key: z.string().min(1, "Field key is required").max(50, "Key too long").regex(/^[a-zA-Z0-9_]+$/, "Key can only contain letters, numbers, and underscores"),
  label: z.string().min(1, "Label is required").max(100, "Label too long"),
  type: z.enum(["text", "textarea"], { required_error: "Field type is required." }),
  isRequired: z.boolean().default(false),
});

const customFormSettingsSchema = z.object({
  title: z.string().min(1, "Form title is required").max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(false),
  fields: z.array(fieldSchema).max(5, "Maximum of 5 custom fields allowed."),
});

type CustomFormSettingsValues = z.infer<typeof customFormSettingsSchema>;

export default function ConfigureCustomFormPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);

  const form = useForm<CustomFormSettingsValues>({
    resolver: zodResolver(customFormSettingsSchema),
    defaultValues: {
      title: "Custom Inquiry Form",
      description: "Please provide details for your custom inquiry.",
      isActive: false,
      fields: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  React.useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setSubmitError(null);
      setSubmitSuccess(null);
      try {
        const response = await fetch(`/api/admin/custom-form-settings?formId=${CUSTOM_FORM_ID}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || "Failed to fetch custom form settings.");
        }
        const data = await response.json();
        if (data.settings) {
          form.reset({
            title: data.settings.title || "Custom Inquiry Form",
            description: data.settings.description || "Please provide details for your custom inquiry.",
            isActive: data.settings.isActive || false,
            fields: data.settings.fields || [],
          });
        }
      } catch (error: any) {
        setSubmitError(error.message);
        toast({ title: "Error Loading Settings", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [form]);

  async function onSubmit(data: CustomFormSettingsValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const response = await fetch(`/api/admin/custom-form-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: CUSTOM_FORM_ID, settings: data }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to save settings.");
      }
      toast({ title: "Settings Saved", description: "Custom form configuration updated." });
      setSubmitSuccess("Settings saved successfully!");
    } catch (error: any) {
      setSubmitError(error.message);
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const addField = () => {
    if (fields.length < 5) {
      append({ key: "", label: "", type: "text", isRequired: false });
    } else {
      toast({ title: "Field Limit Reached", description: "You can add a maximum of 5 custom fields.", variant: "default" });
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Manage Global Custom Form</h1>
        </div>
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-24" />
             <div className="space-y-2 pt-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
          <CardFooter><Skeleton className="h-10 w-28" /></CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/dashboard/forms">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Manage Global Custom Form</h1>
      </div>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Configure the Global Custom Form Template</CardTitle>
              <CardDescription>
                Define the title, description, fields, and active status for the primary custom form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {submitSuccess && (
                <div className="p-3 border rounded-md bg-green-50 border-green-200 text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm">{submitSuccess}</p>
                </div>
              )}
              {submitError && (
                <div className="p-3 border rounded-md bg-red-50 border-red-200 text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">{submitError}</p>
                </div>
              )}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., General Inquiry" {...field} disabled={isSubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief description or instructions for the user." {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Form Active</FormLabel>
                      <FormDescription>
                        If active, users will be able to see and submit this form.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Form Fields ({fields.length}/5)</h3>
                {fields.map((item, index) => (
                  <Card key={item.id} className="p-4 space-y-3 bg-muted/50">
                    <div className="flex justify-between items-center">
                       <p className="font-semibold text-sm">Field {index + 1}</p>
                       <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSubmitting}>
                         <XCircle className="h-4 w-4 text-destructive" />
                       </Button>
                    </div>
                    <FormField
                      control={form.control}
                      name={`fields.${index}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Key/ID</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., user_query (no spaces, unique)" 
                              {...field} 
                              value={field.value || ''} // Ensure controlled
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`fields.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Label</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., What is your question?" 
                              {...field} 
                              value={field.value || ''} // Ensure controlled
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`fields.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select field type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="text"><Text className="inline-block mr-2 h-4 w-4"/>Text Input</SelectItem>
                              <SelectItem value="textarea"><MessageSquareText className="inline-block mr-2 h-4 w-4"/>Text Area</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField control={form.control} name={`fields.${index}.isRequired`} render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 pt-2">
                           <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl>
                           <FormLabel className="font-normal mb-0! mt-0!">Is this field required?</FormLabel>
                        </FormItem>
                     )}/>
                  </Card>
                ))}
                {fields.length < 5 && (
                  <Button type="button" variant="outline" onClick={addField} disabled={isSubmitting}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                  </Button>
                )}
                {fields.length >= 5 && (
                  <p className="text-sm text-muted-foreground">Maximum of 5 fields reached.</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                Save Global Custom Form Settings
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

