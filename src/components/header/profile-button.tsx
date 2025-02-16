"use client";

import { LogOutIcon, UserIcon, ShieldIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "../ui/button";
import AuthDialog from "../auth/auth-dialog";
import useMediaQuery from "~/app/hooks/useMediaQuery";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import OnboardingDialog from "../onboarding-dialog";
import Link from "next/link";

export default function ProfileButton({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut({ callbackUrl: "/" });
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <Button disabled variant="outline" className={className}>
        Loading...
      </Button>
    );
  }

  if (!session) {
    return <AuthDialog className={className} />;
  }

  return isMobile ? (
    <div className="flex flex-col items-start gap-1 rounded-lg border p-4">
      <div className="flex w-full items-center gap-3">
        {session.user?.image && (
          <Image
            src={session.user.image}
            alt="Profile"
            className="h-10 w-10 rounded-full"
            width={40}
            height={40}
          />
        )}
        <div>
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <p className="font-medium">{session.user?.name}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            onClick={() => setShowOnboarding(true)}
            variant="outline"
            size="icon"
          >
            <UserIcon className="h-4 w-4" />
          </Button>
          {session.user?.isAdmin && (
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin">
                <ShieldIcon className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button
            onClick={handleSignOut}
            variant="outline"
            disabled={isLoading}
            size="icon"
          >
            <LogOutIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <>
      <OnboardingDialog
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            {session.user?.image && (
              <Image
                src={session.user.image}
                alt="Profile"
                className="rounded-full"
                width={24}
                height={24}
              />
            )}
            <p className="text-sm text-muted-foreground">
              {session.user?.name}
            </p>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="gap-2"
            onClick={() => setShowOnboarding(true)}
          >
            <UserIcon className="h-4 w-4" />
            Profil bearbeiten
          </DropdownMenuItem>
          {session.user?.isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center gap-2">
                  <ShieldIcon className="h-4 w-4" />
                  Admin Dashboard
                </Link>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2"
            onClick={handleSignOut}
            disabled={isLoading}
          >
            <LogOutIcon className="h-4 w-4" />
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
