"use client";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

interface StatusAlertsProps {
  success: string | null;
  error: string | null;
}

export function StatusAlerts({ 
  success = null, 
  error = null 
}: StatusAlertsProps) {
  // Early return if no alerts to show
  if (!success && !error) return null;

  if (success === "spotify-connected") {
    return (
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertTitle>Erfolgreich</AlertTitle>
        <AlertDescription>
          Dein Spotify-Account wurde erfolgreich verbunden.
        </AlertDescription>
      </Alert>
    );
  }

  if (error === "spotify-auth-failed") {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Fehler</AlertTitle>
        <AlertDescription>
          Die Verbindung zu Spotify konnte nicht hergestellt werden. Bitte
          versuche es erneut.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
