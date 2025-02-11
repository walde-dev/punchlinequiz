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

export default function OnboardingDialog() {
  const { data: session, status, update } = useSession();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(session?.user?.name ?? "");
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image ?? "");
  const [isLoading, setIsLoading] = useState(false);

  // Open dialog when user signs in and doesn't have a name
  useEffect(() => {
    if (status === "authenticated" && session?.user?.name) {
      setOpen(true);
    }
  }, [status, session?.user?.name]);

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
        throw new Error("Failed to update profile");
      }

      await update({ name: username, image: avatarUrl });
      setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
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
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Gib deinen Benutzernamen ein"
              disabled={isLoading}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wird gespeichert..." : "Profil speichern"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
