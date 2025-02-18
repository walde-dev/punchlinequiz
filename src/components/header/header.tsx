import HeaderMenu from "./header-menu";
import Link from "next/link";
import { Button } from "../ui/button";
import { DiscordLogoIcon } from "@radix-ui/react-icons";

export default function Header() {
  return (
    <header className="flex w-full items-center justify-between">
      <Link
        href="/play"
        className="text-xl transition-opacity hover:opacity-80"
      >
        punchline<span className="font-bold text-primary">/</span>
        <span className="font-bold">quiz</span>
      </Link>
      <div className="flex items-center gap-4">
        <HeaderMenu />
        <Button
          variant="outline"
          size="sm"
          className="hidden bg-[#5865F2] text-white hover:bg-[#4752C4] hover:text-white sm:flex"
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
    </header>
  );
}
