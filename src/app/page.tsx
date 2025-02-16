import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center p-4">
      <div className="container flex max-w-[700px] flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold sm:text-6xl">
          Teste dein Rap-Wissen
        </h1>
        <p className="max-w-[600px] text-lg text-muted-foreground sm:text-xl">
          Erkenne die Punchlines aus deinen Lieblingssongs und beweise, dass du
          ein echter Hip-Hop-Head bist.
        </p>
        <Link href="/play" className="mt-4">
          <Button size="lg" className="gap-2">
            Jetzt spielen
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </main>
  );
}
