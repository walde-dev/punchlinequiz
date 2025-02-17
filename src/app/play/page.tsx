"use client";

import { useRef, useState, useEffect } from "react";
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
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useFingerprint } from "../hooks/useFingerprint";
import Link from "next/link";

const MAX_FREE_PLAYS = 3;
const PLAYS_RESET_HOURS = 24;

type GuessResult = {
  isCorrect: boolean;
  punchline?: {
    line: string;
    perfectSolution: string;
    song: {
      name: string;
      artist: {
        name: string;
      };
      album: {
        name: string;
        image: string | null;
      };
    };
  };
};

function formatPunchlineText(text: string) {
  return text.split("/").map((part, index, array) => (
    <span key={index}>
      {part}
      {index < array.length - 1 && (
        <>
          <span className="font-bold text-primary">/</span>
          <br />
        </>
      )}
    </span>
  ));
}

function WinningScreen() {
  return (
    <Card className="md:p-2">
      <CardHeader className="px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6">
        <CardTitle className="text-center text-2xl md:text-4xl">
          🎉 Glückwunsch! 🎉
        </CardTitle>
        <CardDescription className="text-center text-base md:text-lg">
          Du hast alle verfügbaren Punchlines gelöst!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-4 text-center md:px-6">
        <div className="space-y-4">
          <p className="text-lg font-medium">Du bist ein wahrer Rap-Experte!</p>
          <p className="text-muted-foreground">
            Wir arbeiten bereits an neuen Punchlines für dich. Schau bald wieder
            vorbei!
          </p>
        </div>
        <div className="flex justify-center">
          <Button
            asChild
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <Link href="/">Zurück zur Startseite</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlayPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const albumRef = useRef<HTMLDivElement>(null);
  const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
  const {
    data: punchline,
    refetch,
    isLoading: isPunchlineLoading,
    isFetching,
    isError,
  } = useRandomPunchline(fingerprint ?? undefined);
  const mutation = useValidateGuess();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [lastGuess, setLastGuess] = useState<GuessResult | null>(null);
  const [playCount, setPlayCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { width, height } = useWindowSize();

  // Initialize play count from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("punchlineQuizPlays");
    if (!stored) return;

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
        setPlayCount(0);
      } else {
        setPlayCount(data.count);
      }
    } catch {
      setPlayCount(0);
    }
  }, []);

  // Save play count to localStorage whenever it changes
  useEffect(() => {
    if (playCount > 0) {
      localStorage.setItem(
        "punchlineQuizPlays",
        JSON.stringify({
          count: playCount,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }, [playCount]);

  // Scroll to album when correct answer is given
  useEffect(() => {
    if (lastGuess?.isCorrect && albumRef.current) {
      // Small delay to ensure animations have started
      setTimeout(() => {
        albumRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    }
  }, [lastGuess?.isCorrect]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Check if user has exceeded free plays
    if (status !== "loading" && !session && playCount >= MAX_FREE_PLAYS) {
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
    if (fingerprint) {
      formData.append("fingerprint", fingerprint);
    }

    try {
      const result = await mutation.mutateAsync(formData, {
        // Prevent refetching the punchline query on error
        onError: () => false,
        // Only refetch on success
        onSuccess: (data) => data.isCorrect,
      });
      setLastGuess(result);

      if (result.isCorrect) {
        // Show confetti
        setShowConfetti(true);
        // Hide confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000);

        // Increment play count only on correct guesses
        if (!session) {
          const newCount = playCount + 1;
          setPlayCount(newCount);
          if (newCount === MAX_FREE_PLAYS) {
            toast({
              title: "Letzte kostenlose Runde!",
              description:
                "Erstelle einen Account oder melde dich an, um weiterzuspielen.",
            });
          }
        }

        toast({
          title: "Richtig!",
          description: `Die perfekte Lösung war: "${result.punchline?.perfectSolution}"`,
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

  // Show auth prompt if user has exceeded free plays and session is not loading
  if (status !== "loading" && !session && playCount >= MAX_FREE_PLAYS) {
    return (
      <div className="container flex items-center justify-center">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Melde dich an, um weiterzuspielen</CardTitle>
              <CardDescription>
                Melde dich an, um unbegrenzt weiterzuspielen. Du kannst dich
                einfach über dein Google-Konto einloggen.
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

  if (punchline && "allSolved" in punchline) {
    return (
      <div className="flex items-center justify-center px-2 md:px-4">
        <div className="w-full max-w-3xl">
          <WinningScreen />
        </div>
      </div>
    );
  }

  return (
    <>
      {showConfetti && (
        <ReactConfetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={200}
        />
      )}
      <div className="flex items-center justify-center px-2 md:px-4">
        <div className="w-full">
          <Card className="md:p-2">
            <CardHeader className="px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6">
              <CardTitle className="text-lg md:text-2xl">
                Errate die fehlenden Wörter
              </CardTitle>
              <CardDescription className="text-sm">
                Rate die fehlenden Wörter in der Punchline
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-4 md:space-y-6 md:px-6">
              {isPunchlineLoading || isFetching || isFingerprintLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ) : punchline ? (
                <div
                  className={`grid gap-4 md:gap-6 ${lastGuess?.isCorrect ? "grid-cols-1 md:grid-cols-[1fr,300px]" : "grid-cols-1"}`}
                >
                  <div className="space-y-4 md:space-y-6">
                    <div className="flex flex-col items-center space-y-2 text-center md:space-y-4">
                      <h3 className="text-sm font-medium text-muted-foreground md:text-base">
                        Punchline:
                      </h3>
                      <p className="text-xl font-bold leading-normal md:text-4xl">
                        {formatPunchlineText(
                          lastGuess?.isCorrect && lastGuess.punchline
                            ? lastGuess.punchline.line
                            : (punchline?.line ?? ""),
                        )}
                      </p>
                    </div>
                    {lastGuess?.isCorrect && lastGuess.punchline && (
                      <div className="space-y-3 duration-500 animate-in slide-in-from-bottom md:space-y-4">
                        <Alert className="py-2 md:py-4">
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertTitle>Richtig!</AlertTitle>
                          <AlertDescription className="text-sm md:text-base">
                            <p>
                              Die perfekte Lösung war: &quot;
                              {lastGuess.punchline.perfectSolution}&quot;
                            </p>
                          </AlertDescription>
                        </Alert>
                        <div className="flex justify-center">
                          <Button
                            size="default"
                            className="md:size-lg bg-green-600 text-white shadow-lg transition-all hover:bg-green-700 hover:shadow-xl"
                            onClick={() => {
                              setLastGuess(null);
                              refetch();
                            }}
                          >
                            Nächste Punchline →
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  {lastGuess?.isCorrect && lastGuess.punchline && (
                    <div
                      ref={albumRef}
                      className="h-fit space-y-2 rounded-lg border p-3 duration-500 animate-in slide-in-from-bottom md:p-4 md:slide-in-from-right"
                    >
                      <h3 className="text-sm font-semibold md:text-base">
                        Song:
                      </h3>
                      <div className="space-y-3 md:space-y-4">
                        {lastGuess.punchline.song.album.image && (
                          <div className="relative mx-auto aspect-square w-32 overflow-hidden rounded-md md:mx-0 md:w-full">
                            <img
                              src={lastGuess.punchline.song.album.image}
                              alt={`${lastGuess.punchline.song.album.name} Cover`}
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium md:text-base">
                            {lastGuess.punchline.song.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {lastGuess.punchline.song.artist.name}
                          </p>
                          <p className="text-xs text-muted-foreground md:text-sm">
                            Album: {lastGuess.punchline.song.album.name}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
            {!lastGuess?.isCorrect && (
              <CardFooter className="px-4 pb-4 md:px-6 md:pb-6">
                <form
                  onSubmit={handleSubmit}
                  ref={formRef}
                  className="w-full space-y-3 md:space-y-4"
                >
                  <input
                    type="hidden"
                    name="punchlineId"
                    value={punchline?.id ?? ""}
                  />
                  <div className="space-y-2 md:space-y-0 md:flex md:gap-2 md:items-center">
                    <Input
                      name="guess"
                      placeholder={
                        lastGuess?.isCorrect ? "" : "Deine Lösung..."
                      }
                      required
                      disabled={
                        isPunchlineLoading ||
                        mutation.isPending ||
                        lastGuess?.isCorrect
                      }
                      autoComplete="off"
                      className="text-sm md:text-base w-full"
                    />
                    <div className="flex gap-2 md:w-auto md:min-w-[300px]">
                      <Button
                        type="submit"
                        disabled={
                          isPunchlineLoading ||
                          mutation.isPending ||
                          lastGuess?.isCorrect
                        }
                        className="text-sm md:text-base flex-1"
                      >
                        {mutation.isPending
                          ? "Prüfe..."
                          : lastGuess?.isCorrect
                            ? "Gelöst!"
                            : "Prüfen"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isPunchlineLoading || isFetching}
                        onClick={() => {
                          setLastGuess(null);
                          refetch();
                        }}
                        className="text-sm md:text-base flex-1"
                      >
                        {isPunchlineLoading || isFetching ? "Lade..." : "Neue Punchline"}
                      </Button>
                    </div>
                  </div>
                  {lastGuess && !lastGuess.isCorrect && (
                    <Alert
                      variant="destructive"
                      className="py-2 text-sm md:py-4 md:text-base"
                    >
                      <XCircle className="h-4 w-4" />
                      <AlertTitle>Falsch</AlertTitle>
                      <AlertDescription>
                        Das war leider nicht die richtige Lösung. Versuche es
                        noch einmal!
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
