
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mic, Loader2, Search, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface VoiceSearchBarProps {
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceSearchBar({ 
  onSearchChange, 
  placeholder = "Search...",
  className 
}: VoiceSearchBarProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isListening, setIsListening] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const SpeechRecognitionImpl = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionImpl) {
        if (!recognitionRef.current) { // Initialize only if not already initialized
          recognitionRef.current = new SpeechRecognitionImpl();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = false;
          recognitionRef.current.lang = "en-US";

          recognitionRef.current.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setSearchTerm(transcript);
            if (onSearchChange) {
              onSearchChange(transcript);
            }
            setIsListening(false); // Stop listening after getting a result
            toast({
              title: "Search updated",
              description: `Searching for: ${transcript}`,
            });
          };

          recognitionRef.current.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            let errorMessage = "Speech recognition error.";
            if (event.error === 'no-speech') {
              errorMessage = "No speech detected. Please try again.";
            } else if (event.error === 'audio-capture') {
              errorMessage = "Microphone error. Please check your microphone and permissions.";
            } else if (event.error === 'not-allowed') {
              errorMessage = "Permission to use microphone was denied. Please enable it in your browser settings.";
            } else if (event.error === 'network') {
                errorMessage = "Network error. Please check your internet connection.";
            }
            toast({
              title: "Voice Search Error",
              description: errorMessage,
              variant: "destructive",
            });
            setIsListening(false); // Ensure listening state is reset on error
          };

          recognitionRef.current.onend = () => {
            // This event fires when recognition stops, either successfully, due to an error, or no-speech.
            // isListening state should be false by now if onresult or onerror fired.
            // If it's still true, it might mean it stopped without result/error (e.g. manual stop not yet reflected or timeout)
             if (isListening) { // Check current React state
                setIsListening(false);
             }
          };
        }
      } else {
        if (isMounted) { // Only show toast if component is fully mounted
            toast({
                title: "Voice Search Not Supported",
                description: "Your browser does not support voice recognition.",
                variant: "destructive",
            });
        }
      }
    }
    // Cleanup function to stop recognition if component unmounts while listening
    return () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
  // onSearchChange is a dependency because it's used in onresult.
  // isMounted is used to gate the "not supported" toast
  // isListening is used in the cleanup.
  }, [onSearchChange, isMounted, isListening]); 

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    if (onSearchChange) {
      onSearchChange(newSearchTerm);
    }
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice Search Not Available",
        description: "Speech recognition is not properly initialized or supported.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false); // Explicitly set state, onend will also fire.
    } else {
      try {
        // Ensure microphone permission (modern browsers require this)
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak now to search.",
        });
      } catch (err) {
        console.error("Microphone permission error:", err);
        toast({
          title: "Microphone Access Denied",
          description: "Please allow microphone access in your browser settings to use voice search.",
          variant: "destructive",
        });
        setIsListening(false);
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    if (onSearchChange) {
      onSearchChange("");
    }
    if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
    }
  };
  
  if (!isMounted) {
    // Optional: Render a placeholder or null while waiting for mount
    return (
        <div className={cn("relative flex w-full items-center", className)}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                className="pl-10 pr-16 py-2 h-10 text-sm rounded-lg shadow-sm w-full"
                disabled
            />
            <Button
                variant="outline"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md"
                disabled
            >
                <Mic className="h-4 w-4" />
            </Button>
        </div>
    );
  }

  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        className="pl-10 pr-20 py-2 h-10 text-sm rounded-lg shadow-sm focus:ring-primary focus:border-primary w-full" // Increased pr for clear button
      />
      {searchTerm && (
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSearch}
          className="absolute right-10 top-1/2 -translate-y-1/2 h-7 w-7"
          aria-label="Clear search"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </Button>
      )}
      <Button
        variant={isListening ? "default" : "outline"}
        size="icon"
        onClick={toggleListening}
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md"
        aria-label={isListening ? "Stop listening" : "Start voice search"}
        disabled={!recognitionRef.current && typeof window !== 'undefined'}
      >
        {isListening ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
