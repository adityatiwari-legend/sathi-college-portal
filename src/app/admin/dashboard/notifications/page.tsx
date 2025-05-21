
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Bell, Loader2, AlertTriangle, RefreshCw, Trash2, FileText, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Added this import

interface AdminNotification {
  id: string;
  message: string;
  type: string;
  timestamp: string | null; // ISO string
  isRead: boolean;
  userId?: string;
  userEmail?: string;
  relatedFormId?: string;
  relatedFormType?: string;
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = React.useState<AdminNotification[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/notifications");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to fetch notifications: ${response.statusText}`);
      }
      const data: AdminNotification[] = await response.json();
      setNotifications(data);
    } catch (err: any) {
      console.error("Error fetching admin notifications:", err);
      setError(err.message || "Could not load notifications.");
      toast({ title: "Error Loading Notifications", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
  }, []);
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'form_deletion':
        return <Trash2 className="h-5 w-5 text-destructive" aria-label="Form Deletion"/>;
      case 'new_submission': // Example for future
        return <FileText className="h-5 w-5 text-blue-500" aria-label="New Submission"/>;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" aria-label="General Notification"/>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Admin Notifications</h1>
        </div>
        <Button variant="outline" size="icon" onClick={fetchNotifications} disabled={isLoading} aria-label="Refresh notifications">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Recent Activity & Alerts</CardTitle>
          <CardDescription>
            Overview of important system events and user actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-2 border-b">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-grow">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          )}
          {error && !isLoading && (
            <div role="alert" className="p-4 border rounded-md bg-destructive/10 border-destructive/30 text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          {!isLoading && !error && notifications.length === 0 && (
            <p className="text-center text-muted-foreground py-10">
              No notifications found.
            </p>
          )}
          {!isLoading && !error && notifications.length > 0 && (
             <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Type</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="hidden md:table-cell">User</TableHead>
                    <TableHead className="text-right">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notif) => (
                    <TableRow key={notif.id} className={cn(!notif.isRead && "bg-primary/5 hover:bg-primary/10")}>
                      <TableCell>{getNotificationIcon(notif.type)}</TableCell>
                      <TableCell className="font-medium">
                        <p className="text-sm">{notif.message}</p>
                        {notif.relatedFormId && (
                           <Link 
                             href={`/admin/dashboard/view-form/${notif.relatedFormId}?type=${encodeURIComponent(notif.relatedFormType || '')}`} 
                             className="text-xs text-primary hover:underline"
                           >
                             View Related Form
                           </Link>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground" title={notif.userEmail || notif.userId}>
                        {notif.userId && (
                            <div className="flex items-center gap-1">
                                <UserCircle className="h-4 w-4 flex-shrink-0"/> 
                                <span className="truncate max-w-[150px]">{notif.userEmail || notif.userId}</span>
                            </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {notif.timestamp ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{format(new Date(notif.timestamp), "PP pp")}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
