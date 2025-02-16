"use client";

import { useRef, useState } from "react";
import { useRandomPunchline, useValidateGuess } from "../hooks/useGame";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import AuthDialog from "~/components/auth/auth-dialog";

const MAX_FREE_PLAYS = 3;
const PLAYS_RESET_HOURS = 24;

export default function PlayPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const { data: punchline, isLoading, isError } = useRandomPunchline();
  const mutation = useValidateGuess();
  const { toast } = useToast();
  const { data: session } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [lastGuess, setLastGuess] = useState<{
    isCorrect: boolean;
    perfectSolution?: string;
  } | null>(null);

  // Get and validate play count from localStorage
  const getPlayCount = () => {
    const stored = localStorage.getItem("punchlineQuizPlays");
    if (!stored) return 0;

    try {
      const data = JSON.parse(stored);
      const now = new Date();
      const lastPlay = new Date(data.timestamp);

      // Reset if last play was more than PLAYS_RESET_HOURS hours ago
      if (
        now.getTime() - lastPlay.getTime() >
        PLAYS_RESET_HOURS * 60 * 60 * 1000
      ) {
        localStorage.removeItem("punchlineQuizPlays");
        return 0;
      }

      return data.count;
    } catch {
      return 0;
    }
  };

  // Increment play count
  const incrementPlayCount = () => {
    const count = getPlayCount() + 1;
    localStorage.setItem(
      "punchlineQuizPlays",
      JSON.stringify({
        count,
        timestamp: new Date().toISOString(),
      }),
    );
    return count;
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Check if user has exceeded free plays
    if (!session && getPlayCount() >= MAX_FREE_PLAYS) {
      toast({
        title: "Spiel limitiert",
        description:
          "Erstelle einen Account oder melde dich an, um weiterzuspielen!",
        variant: "destructive",
      });
      setShowAuthDialog(true);
      return;
    }

    const formData = new FormData(e.currentTarget);

    try {
      const result = await mutation.mutateAsync(formData);
      setLastGuess(result);

      if (result.isCorrect) {
        // Increment play count only on correct guesses
        if (!session) {
          const plays = incrementPlayCount();
          if (plays === MAX_FREE_PLAYS) {
            toast({
              title: "Letzte kostenlose Runde!",
              description:
                "Erstelle einen Account oder melde dich an, um weiterzuspielen.",
            });
          }
        }

        toast({
          title: "Richtig!",
          description: `Die perfekte Lösung war: "${result.perfectSolution}"`,
        });
        formRef.current?.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Leider falsch",
          description: "Versuche es noch einmal!",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description:
          error instanceof Error
            ? error.message
            : "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
      });
    }
  }

  // Show auth prompt if user has exceeded free plays
  if (!session && getPlayCount() >= MAX_FREE_PLAYS) {
    return (
      <div className="container flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Kostenlose Runden aufgebraucht</CardTitle>
              <CardDescription>
                Du hast deine {MAX_FREE_PLAYS} kostenlosen Runden aufgebraucht.
                Erstelle einen Account oder melde dich an, um weiterzuspielen!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Mit einem Account kannst du:
              </p>
              <ul className="list-disc pl-4 text-sm text-muted-foreground">
                <li>Unbegrenzt Punchlines raten</li>
                <li>Deinen Fortschritt speichern</li>
                <li>Neue Features freischalten</li>
              </ul>
            </CardContent>
            <CardFooter>
              <AuthDialog
                open={showAuthDialog}
                onOpenChange={setShowAuthDialog}
                callbackUrl="/play"
                className="w-full bg-primary text-primary-foreground"
              />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Fehler</AlertTitle>
        <AlertDescription>
          Die Punchline konnte nicht geladen werden. Bitte versuche es später
          erneut.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <div className="container flex items-center justify-center">
        <div className="w-full">
          <Card>
            <CardHeader>
              <CardTitle>Errate die fehlenden Wörter</CardTitle>
              <CardDescription>
                Rate die fehlenden Wörter in der Punchline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : punchline ? (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Punchline:</h3>
                    <p className="text-lg">
                      {punchline.line
                        .replace(
                          /\{([^}]+)\}/,
                          lastGuess?.isCorrect ? "$1" : "...",
                        )
                        .replace(
                          /\[([^\]]+)\]/,
                          lastGuess?.isCorrect ? "$1" : "...",
                        )}
                    </p>
                  </div>
                  {lastGuess?.isCorrect && (
                    <>
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertTitle>Richtig!</AlertTitle>
                        <AlertDescription className="space-y-2">
                          <p>
                            Die perfekte Lösung war: &quot;
                            {lastGuess.perfectSolution}&quot;
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setLastGuess(null);
                              window.location.reload();
                            }}
                          >
                            Nächste Punchline
                          </Button>
                        </AlertDescription>
                      </Alert>
                      <div className="space-y-2">
                        <h3 className="font-semibold">Song:</h3>
                        <div className="flex items-start gap-4">
                          {punchline.song.album.image && (
                            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md">
                              <img
                                src={punchline.song.album.image}
                                alt={`${punchline.song.album.name} Cover`}
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <p>
                              {punchline.song.name} -{" "}
                              {punchline.song.artist.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Album: {punchline.song.album.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              ) : null}
            </CardContent>
            <CardFooter>
              <form
                onSubmit={handleSubmit}
                ref={formRef}
                className="w-full space-y-4"
              >
                <input
                  type="hidden"
                  name="punchlineId"
                  value={punchline?.id ?? ""}
                />
                <div className="flex gap-2">
                  <Input
                    name="guess"
                    placeholder="Deine Lösung..."
                    required
                    disabled={
                      isLoading || mutation.isPending || lastGuess?.isCorrect
                    }
                    autoComplete="off"
                  />
                  <Button
                    type="submit"
                    disabled={
                      isLoading || mutation.isPending || lastGuess?.isCorrect
                    }
                  >
                    {mutation.isPending
                      ? "Prüfe..."
                      : lastGuess?.isCorrect
                        ? "Gelöst!"
                        : "Prüfen"}
                  </Button>
                </div>
                {lastGuess && !lastGuess.isCorrect && (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Falsch</AlertTitle>
                    <AlertDescription>
                      Das war leider nicht die richtige Lösung. Versuche es noch
                      einmal!
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
}
