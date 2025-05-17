
"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { ArrowLeft, Save, Loader2, Settings, AlertTriangle, CheckCircle, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription as ShadFormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"; // Added missing import

const MAX_FIELDS = 5;

const customFormFieldSchema = z.object({
  fieldKey: z.string().min(1, "Field key is required (e.g., 'custom_question_1')").regex(/^[a-zA-Z0-9_]+$/, "Key can only contain letters, numbers, and underscores."),
  label: z.string().min(3, "Label must be at least 3 characters.").max(100),
  type: z.enum(["text", "textarea"], { required_error: "Field type is required." }),
  isRequired: z.boolean().default(false),
});

const customFormSettingsSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  isActive: z.boolean().default(false),
  fields: z.array(customFormFieldSchema).max(MAX_FIELDS, `You can add a maximum of ${MAX_FIELDS} fields.`),
});

type CustomFormSettingsValues = z.infer<typeof customFormSettingsSchema>;

const CUSTOM_FORM_ID = "mainGlobalCustomForm"; // Using a fixed ID for this single global custom form

export default function ConfigureCustomFormPage() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = React.useState(true);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = React.useState<string | null>(null);

  const form = useForm<CustomFormSettingsValues>({
    resolver: zodResolver(customFormSettingsSchema),
    defaultValues: {
      title: "Custom Inquiry Form",
      description: "Please provide the following information.",
      isActive: false,
      fields: [{ fieldKey: "question_1", label: "Your Question 1", type: "text", isRequired: true }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "fields",
  });

  const fetchSettings = React.useCallback(async () => {
    setIsLoadingSettings(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const response = await fetch(`/api/admin/custom-form-settings?formId=${CUSTOM_FORM_ID}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to load custom form settings. Status: ${response.status}`);
      }
      const data = await response.json();
      if (data.settings) {
        form.reset({
          title: data.settings.title || "Custom Inquiry Form",
          description: data.settings.description || "Please provide the following information.",
          isActive: data.settings.isActive === undefined ? false : data.settings.isActive,
          fields: data.settings.fields && data.settings.fields.length > 0 ? data.settings.fields : [{ fieldKey: "question_1", label: "Your Question 1", type: "text", isRequired: true }],
        });
      }
    } catch (err: any) {
      setSubmitError(err.message);
      toast({ title: "Error Loading Settings", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingSettings(false);
    }
  }, [form]);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function onSubmit(data: CustomFormSettingsValues) {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const response = await fetch("/api/admin/custom-form-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formId: CUSTOM_FORM_ID, ...data }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to save custom form settings. Status: ${response.status}`);
      }
      toast({ title: "Settings Saved", description: "Custom form settings have been updated." });
      setSubmitSuccess("Custom form settings saved successfully!");
      fetchSettings(); 
    } catch (err: any) {
      setSubmitError(err.message);
      toast({ title: "Error Saving Settings", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Configure Global Custom Form</h1>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6 text-primary" />
                Custom Form Settings
              </CardTitle>
              <CardDescription>
                Define the structure and availability of the global custom form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingSettings ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-6 w-10" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  {[1, 2].map(i => (
                    <div key={i} className="space-y-2 border p-4 rounded-md">
                      <Skeleton className="h-8 w-1/2" /> <Skeleton className="h-8 w-1/2" /> <Skeleton className="h-8 w-1/4" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {submitSuccess && (
                    <div className="p-3 border rounded-md bg-green-50 border-green-200 text-green-700 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" /> <p className="text-sm">{submitSuccess}</p>
                    </div>
                  )}
                  {submitError && (
                    <div className="p-3 border rounded-md bg-red-50 border-red-200 text-red-700 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> <p className="text-sm">{submitError}</p>
                    </div>
                  )}
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form Title</FormLabel>
                      <FormControl><Input placeholder="E.g., General Inquiry" {...field} disabled={isSubmitting}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form Description</FormLabel>
                      <FormControl><Textarea placeholder="A brief description for the custom form." {...field} disabled={isSubmitting}/></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}/>
                  <FormField control={form.control} name="isActive" render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Form Active</FormLabel>
                        <ShadFormDescription>Allow users to access and submit this form.</ShadFormDescription>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting}/></FormControl>
                    </FormItem>
                  )}/>

                  <div className="space-y-4">
                    <FormLabel>Form Fields (Max {MAX_FIELDS})</FormLabel>
                    {fields.map((item, index) => (
                      <Card key={item.id} className="p-4 space-y-3 bg-muted/50">
                        <div className="flex justify-between items-center">
                           <p className="font-medium">Field {index + 1}</p>
                           <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={isSubmitting || fields.length <= 1}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                           </Button>
                        </div>
                        <FormField control={form.control} name={`fields.${index}.fieldKey`} render={({ field }) => (
                           <FormItem>
                            <FormLabel>Field Key (Unique ID, no spaces)</FormLabel>
                            <FormControl><Input placeholder="e.g., user_feedback" {...field} disabled={isSubmitting}/></FormControl>
                            <FormMessage />
                           </FormItem>
                        )}/>
                        <FormField control={form.control} name={`fields.${index}.label`} render={({ field }) => (
                           <FormItem>
                            <FormLabel>Field Label (Visible to user)</FormLabel>
                            <FormControl><Input placeholder="E.g., Your Feedback" {...field} disabled={isSubmitting}/></FormControl>
                            <FormMessage />
                           </FormItem>
                        )}/>
                        <FormField control={form.control} name={`fields.${index}.type`} render={({ field }) => (
                           <FormItem>
                            <FormLabel>Field Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select field type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value="text">Text Input</SelectItem>
                                <SelectItem value="textarea">Text Area</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                           </FormItem>
                        )}/>
                         <FormField control={form.control} name={`fields.${index}.isRequired`} render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 pt-2">
                               <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} /></FormControl>
                               <FormLabel className="font-normal mb-0! mt-0!">Is this field required?</FormLabel>
                            </FormItem>
                         )}/>
                      </Card>
                    ))}
                     {fields.length < MAX_FIELDS && (
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ fieldKey: `custom_field_${fields.length + 1}`, label: "", type: "text", isRequired: false })} disabled={isSubmitting}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Field
                      </Button>
                    )}
                    {form.formState.errors.fields?.root?.message && <FormMessage>{form.formState.errors.fields.root.message}</FormMessage>}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-end">
               <Button type="submit" disabled={isSubmitting || isLoadingSettings}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isSubmitting ? "Saving..." : "Save Custom Form Settings"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
