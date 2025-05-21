
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Save, Trash2, PlusCircle, Loader2, Settings, AlertTriangle, CheckCircle, Text, Pilcrow } from "lucide-react";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";


const customFormFieldSchema = z.object({
  key: z.string().min(1, "Field key is required").regex(/^[a-zA-Z0-9_]+$/, "Key can only contain letters, numbers, and underscores."),
  label: z.string().min(1, "Field label is required."),
  type: z.enum(["text", "textarea"], { required_error: "Field type is required." }),
  isRequired: z.boolean().default(false),
});

const customFormSettingsSchema = z.object({
  formId: z.string().default("mainGlobalCustomForm"),
  title: z.string().min(3, "Form title must be at least 3 characters.").max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(false),
  fields: z.array(customFormFieldSchema).max(10, "You can add a maximum of 10 fields."), // Limiting fields for now
});

type CustomFormSettingsValues = z.infer<typeof customFormSettingsSchema>;

const CUSTOM_FORM_ID = "mainGlobalCustomForm";

export default function ConfigureCustomFormPage() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const form = useForm<CustomFormSettingsValues>({
    resolver: zodResolver(customFormSettingsSchema),
    defaultValues: {
      formId: CUSTOM_FORM_ID,
      title: "Custom Inquiry Form",
      description: "Please provide details for your custom inquiry.",
      isActive: false,
      fields: [
        { key: "subject", label: "Subject", type: "text", isRequired: true },
        { key: "details", label: "Details", type: "textarea", isRequired: true },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const fetchSettings = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      console.log(`ConfigureCustomFormPage: Fetching settings for formId: ${CUSTOM_FORM_ID}`);
      const response = await fetch(`/api/admin/custom-form-settings?formId=${CUSTOM_FORM_ID}`);
      if (!response.ok) {
        let errorData = { error: { message: `Failed to fetch settings. Status: ${response.status}`}};
        try {
          const jsonError = await response.json();
          if (jsonError && jsonError.error) {
            errorData = jsonError;
          }
        } catch (parseError) {
          console.warn("ConfigureCustomFormPage: Could not parse JSON error response from API.", parseError);
        }
        throw new Error(errorData.error?.message || `Failed to fetch settings. Status: ${response.status}`);
      }
      const data = await response.json();
      console.log("ConfigureCustomFormPage: Settings fetched successfully:", data);
      if (data && data.settings) {
        form.reset({
          formId: data.settings.formId || CUSTOM_FORM_ID,
          title: data.settings.title || "Custom Inquiry Form",
          description: data.settings.description || "Please provide details for your custom inquiry.",
          isActive: data.settings.isActive === undefined ? false : data.settings.isActive,
          fields: data.settings.fields && data.settings.fields.length > 0 ? data.settings.fields : [
            { key: "subject", label: "Subject", type: "text", isRequired: true },
            { key: "details", label: "Details", type: "textarea", isRequired: true },
          ],
        });
      }
    } catch (err: any) {
      console.error("ConfigureCustomFormPage: Error fetching custom form settings:", err);
      setError(err.message || "Could not load custom form settings.");
      toast({ title: "Error Loading Settings", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [form]);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function onSubmit(data: CustomFormSettingsValues) {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    console.log("ConfigureCustomFormPage: Submitting custom form settings:", data);
    try {
      const response = await fetch("/api/admin/custom-form-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: CUSTOM_FORM_ID, ...data }),
      });

      if (!response.ok) {
        let errorData = { error: { message: `Failed to save settings. Status: ${response.status}`}};
        try {
          const jsonError = await response.json();
           if (jsonError && jsonError.error) {
            errorData = jsonError;
          }
        } catch (parseError) {
           console.warn("ConfigureCustomFormPage: Could not parse JSON error response from API during save.", parseError);
        }
        throw new Error(errorData.error?.message || `Failed to save settings. Status: ${response.status}`);
      }
      await response.json();
      setSuccessMessage("Global Custom Form settings saved successfully!");
      toast({ title: "Settings Saved", description: "Global Custom Form settings have been updated." });
      fetchSettings(); // Re-fetch to ensure UI consistency if needed
    } catch (err: any) {
      console.error("ConfigureCustomFormPage: Error saving custom form settings:", err);
      setError(err.message || "Failed to save settings.");
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-60" />
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <Skeleton className="h-7 w-1/2 mb-1" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-8 w-32" />
            <div className="font-semibold mt-4 mb-2"><Skeleton className="h-6 w-1/4" /></div>
            <Skeleton className="h-12 w-full mb-2" />
            <Skeleton className="h-12 w-full mb-2" />
          </CardContent>
          <CardFooter className="border-t pt-6 flex justify-end">
            <Skeleton className="h-10 w-32" />
          </CardFooter>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dashboard/forms">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Manage Global Custom Form</h1>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Configure the Global Custom Form Template</CardTitle>
              <CardDescription>
                Define the structure and behavior of the global custom form that users can fill.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {successMessage && (
                <div className="p-3 border rounded-md bg-green-50 border-green-200 text-green-700 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  <p className="text-sm">{successMessage}</p>
                </div>
              )}
              {error && (
                <div className="p-3 border rounded-md bg-red-50 border-red-200 text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., General Inquiry, Feedback Form" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormDescription>The title users will see for this form.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Form Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="A brief description or instructions for users." {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Form Active</FormLabel>
                      <FormDescription>
                        If checked, users will be able to see and submit this form.
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

              <div>
                <h3 className="text-lg font-semibold mb-3">Form Fields</h3>
                {fields.map((item, index) => (
                  <Card key={item.id} className="mb-4 p-4 space-y-3 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Field {index + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={isSubmitting || fields.length <= 1}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove field</span>
                      </Button>
                    </div>
                     <FormField
                      control={form.control}
                      name={`fields.${index}.key`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Field Key (Unique ID)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., user_feedback, contact_reason" {...field} disabled={isSubmitting} />
                          </FormControl>
                          <FormDescription>A unique identifier for this field (no spaces or special characters other than underscore).</FormDescription>
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
                            <Input placeholder="e.g., Your Feedback, Reason for Contact" {...field} disabled={isSubmitting} />
                          </FormControl>
                           <FormDescription>What the user sees as the name of the field.</FormDescription>
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
                              <SelectItem value="text">
                                <div className="flex items-center gap-2"><Text className="h-4 w-4"/>Text Input</div>
                              </SelectItem>
                              <SelectItem value="textarea">
                                <div className="flex items-center gap-2"><Pilcrow className="h-4 w-4"/>Text Area</div>
                              </SelectItem>
                              {/* Add more types like 'select', 'checkbox', 'radio' in the future */}
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ key: `new_field_${fields.length + 1}`, label: "", type: "text", isRequired: false })}
                  disabled={isSubmitting || fields.length >= 10}
                  className="mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                </Button>
                {fields.length >= 10 && <p className="text-xs text-destructive mt-1">Maximum of 10 fields reached.</p>}
              </div>


            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {isSubmitting ? "Saving..." : "Save Custom Form Settings"}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
