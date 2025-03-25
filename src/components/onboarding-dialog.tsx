"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useSession } from "next-auth/react";
import { useToast } from "./ui/use-toast";
import { useFingerprint } from "~/app/hooks/useFingerprint";

interface OnboardingDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function OnboardingDialog({ open: controlledOpen, onOpenChange }: OnboardingDialogProps) {
  const { data: session, status, update } = useSession();
  const [internalOpen, setInternalOpen] = useState(false);
  const [username, setUsername] = useState(session?.user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { fingerprint } = useFingerprint();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  // Open dialog when user signs in and doesn't have a name
  useEffect(() => {
    if (status === "authenticated" && !session?.user?.name) {
      setIsOpen?.(true);
    }
  }, [status, session?.user?.name, setIsOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: username,
          image: avatarUrl,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast({
          variant: "destructive",
          title: "Fehler",
          description: errorText,
        });
        throw new Error(errorText);
      }

      await update({ name: username, image: avatarUrl });

      // Track profile update
      if (fingerprint) {
        const formData = new FormData();
        formData.append("fingerprint", fingerprint);
        formData.append("type", "profile_update");
        await fetch("/api/track", {
          method: "POST",
          body: formData,
        });
      }

      setIsOpen?.(false);
      toast({
        title: "Erfolgreich gespeichert",
        description: "Dein Profil wurde aktualisiert.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything while loading
  if (status === "loading") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Profil vervollständigen</DialogTitle>
          <DialogDescription>
            Lass uns deine Erfahrung personalisieren. Wähle einen Benutzernamen
            und lade ein Profilbild hoch.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="avatar">Profilbild</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback>
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                disabled={isLoading}
                onClick={() => {
                  const fileInput = document.createElement("input");
                  fileInput.type = "file";
                  fileInput.accept = "image/*";
                  fileInput.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setAvatarUrl(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  fileInput.click();
                }}
              >
                Hochladen
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Benutzername</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow alphanumeric characters, underscores, and dots
                if (/^[a-zA-Z0-9._]*$/.test(value)) {
                  setUsername(value);
                }
              }}
              placeholder="Gib deinen Benutzernamen ein"
              disabled={isLoading}
              required
              maxLength={16}
              pattern="^[a-zA-Z0-9._]+$"
              title="Nur Buchstaben, Zahlen, Unterstriche und Punkte sind erlaubt"
            />
            <p className="text-sm text-muted-foreground">
              Max. 16 Zeichen, erlaubt sind Buchstaben, Zahlen, Punkte und
              Unterstriche.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              value={session?.user?.email ?? ""}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Deine E-Mail-Adresse von Google
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wird gespeichert..." : "Profil speichern"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
