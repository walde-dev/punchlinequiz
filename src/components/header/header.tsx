import HeaderMenu from "./header-menu";

export default function Header() {
  return (
    <header className="flex w-full items-center justify-between">
      <span className="text-xl">
        punchline<span className="text-primary font-bold">/</span>
        <span className="font-bold">quiz</span>
      </span>
      <HeaderMenu />
    </header>
  );
}
