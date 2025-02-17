import HeaderMenu from "./header-menu";
import Link from "next/link";

export default function Header() {
  return (
    <header className="flex w-full items-center justify-between">
      <Link href="/play" className="text-xl hover:opacity-80 transition-opacity">
        punchline<span className="text-primary font-bold">/</span>
        <span className="font-bold">quiz</span>
      </Link>
      <HeaderMenu />
    </header>
  );
}
