"use client";

import { Alert, AlertDescription } from "~/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

interface StatusAlertsProps {
  searchParams: {
    success?: string;
    error?: string;
  };
}

export function StatusAlerts({ searchParams }: StatusAlertsProps) {
  const { success, error } = searchParams;

  if (!success && !error) return null;

  return (
    <div className="space-y-2">
      {success === "spotify-connected" && (
        <Alert variant="default" className="border-green-500">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription>Spotify wurde erfolgreich verbunden!</AlertDescription>
        </Alert>
      )}
      {error === "spotify-auth-failed" && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Spotify konnte nicht verbunden werden. Bitte versuche es erneut.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
