"use client";

import { HamburgerMenuIcon, DiscordLogoIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import useMediaQuery from "~/app/hooks/useMediaQuery";
import ProfileButton from "./profile-button";
import Link from "next/link";

export default function HeaderMenu() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return isMobile ? (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <HamburgerMenuIcon className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="mt-4 flex flex-col gap-4">
          <ProfileButton className="w-full" />
          <Button
            variant="outline"
            size="default"
            className="w-full bg-[#5865F2] text-white hover:bg-[#4752C4] hover:text-white"
            asChild
          >
            <Link
              href="https://discord.gg/3NV6dGZWGY"
              target="_blank"
              rel="noopener noreferrer"
            >
              <DiscordLogoIcon className="mr-2 h-4 w-4" />
              Join Discord
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  ) : (
    <div className="flex items-center gap-2">
      <ProfileButton />
    </div>
  );
}
