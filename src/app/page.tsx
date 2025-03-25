import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ArrowRight, MusicIcon, BrainCircuitIcon } from "lucide-react";

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

function GameCard({ title, description, icon, href }: GameCardProps) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-lg border bg-card text-card-foreground transition-colors hover:bg-accent"
    >
      <div className="flex flex-col items-center gap-1.5 p-2 text-center sm:gap-4 sm:p-6">
        <div className="rounded-full border-2 border-primary bg-background p-1.5 transition-transform group-hover:scale-110 sm:p-4">
          {icon}
        </div>
        <div className="space-y-0.5 sm:space-y-2">
          <h2 className="text-base font-bold sm:text-2xl">{title}</h2>
          <p className="text-[10px] text-muted-foreground sm:text-base">{description}</p>
        </div>
        <Button size="sm" className="mt-0.5 gap-1.5 sm:mt-2 sm:size-default">
          Spielen
          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </Link>
  );
}

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="container flex max-w-[1000px] flex-col items-center gap-2 text-center sm:gap-8">
        <h1 className="text-2xl font-bold sm:text-6xl">
          Teste dein Rap-Wissen
        </h1>
        <p className="max-w-[600px] text-xs text-muted-foreground sm:text-lg sm:text-xl">
          Erkenne Punchlines aus deinen Lieblingssongs und beweise, dass du
          ein echter Hip-Hop-Head bist.
        </p>
        
        <div className="mt-2 grid w-full gap-2 sm:mt-8 sm:gap-6 sm:grid-cols-2">
          <GameCard
            title="Finishing Lines"
            description="Vervollständige die Punchline aus dem Song. Je genauer deine Antwort, desto mehr Punkte bekommst du."
            icon={<MusicIcon className="h-5 w-5 sm:h-8 sm:w-8" />}
            href="/play/finishing-lines"
          />
          <GameCard
            title="Quiz"
            description="Von welchem Künstler stammt diese Punchline? Wähle aus drei Optionen und teste dein Wissen über die Rap-Szene."
            icon={<BrainCircuitIcon className="h-5 w-5 sm:h-8 sm:w-8" />}
            href="/play/quiz"
          />
        </div>

        <div className="mt-2 flex flex-col items-center gap-0.5 text-center text-[10px] text-muted-foreground sm:mt-8 sm:gap-2 sm:text-sm">
          <p>Wähle einen Spielmodus und starte direkt los.</p>
          <p>Keine Anmeldung erforderlich, aber mit Account kannst du deinen Fortschritt speichern.</p>
        </div>
      </div>
    </main>
  );
}
