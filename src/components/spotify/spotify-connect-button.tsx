"use client";

import { Button } from "~/components/ui/button";
import { Music2Icon } from "lucide-react";
import { useToast } from "../ui/use-toast";

export function SpotifyConnectButton() {
  const { toast } = useToast();

  const handleConnect = async () => {
    try {
      const response = await fetch("/api/spotify/auth", {
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Redirect to Spotify's authorization page
      window.location.href = data.url;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description:
          error instanceof Error
            ? error.message
            : "Verbindung zu Spotify fehlgeschlagen",
      });
    }
  };

  return (
    <Button 
      onClick={handleConnect} 
      className="gap-2 bg-[#1DB954] text-white hover:bg-[#1DB954]/90"
    >
      <Music2Icon className="h-4 w-4" />
      Mit Spotify verbinden
    </Button>
  );
}
