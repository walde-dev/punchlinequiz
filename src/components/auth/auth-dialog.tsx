"use client";

import { useState } from "react";
import GoogleOAuthButton from "../oauth/google-oauth-button";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

interface AuthDialogProps {
  className?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  callbackUrl?: string;
}

export default function AuthDialog({ 
  className, 
  trigger, 
  open, 
  onOpenChange,
  callbackUrl = "/play"
}: AuthDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" className={className}>
            Anmelden
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Willkommen beim Punchline Quiz</DialogTitle>
          <DialogDescription>
            Melde dich an, um unbegrenzt zu spielen, deinen Fortschritt zu speichern und mit Freunden zu vergleichen.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Anmelden mit
              </span>
            </div>
          </div>
          <GoogleOAuthButton 
            className="w-full" 
            callbackUrl={callbackUrl}
          />
          <p className="text-center text-sm text-muted-foreground">
            Mit der Anmeldung akzeptierst du unsere{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Nutzungsbedingungen
            </a>{" "}
            und{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Datenschutzerklärung
            </a>
            .
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
