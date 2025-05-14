
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
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = "en-US";

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setSearchTerm(transcript);
          if (onSearchChange) {
            onSearchChange(transcript);
          }
          setIsListening(false);
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
            errorMessage = "Microphone error. Please check your microphone.";
          } else if (event.error === 'not-allowed') {
            errorMessage = "Permission to use microphone was denied.";
          }
          toast({
            title: "Voice Search Error",
            description: errorMessage,
            variant: "destructive",
          });
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          if (isListening) { // Only set to false if it was manually stopped or errored
             setIsListening(false);
          }
        };
      } else {
        toast({
          title: "Voice Search Not Supported",
          description: "Your browser does not support voice recognition.",
          variant: "destructive",
        });
      }
    }
  }, [onSearchChange, isListening]); // Added isListening to dependencies

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    if (onSearchChange) {
      onSearchChange(newSearchTerm);
    }
  };

  const toggleListening = () => {
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
      setIsListening(false);
    } else {
      // Check for microphone permission
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
          recognitionRef.current.start();
          setIsListening(true);
          toast({
            title: "Listening...",
            description: "Speak now to search.",
          });
        })
        .catch(err => {
          console.error("Microphone permission error:", err);
          toast({
            title: "Microphone Access Denied",
            description: "Please allow microphone access to use voice search.",
            variant: "destructive",
          });
          setIsListening(false);
        });
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    if (onSearchChange) {
      onSearchChange("");
    }
  };
  
  if (!isMounted) {
    return null; // Or a loading skeleton
  }

  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        className="pl-10 pr-16 py-2 h-10 text-sm rounded-lg shadow-sm focus:ring-primary focus:border-primary w-full"
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
