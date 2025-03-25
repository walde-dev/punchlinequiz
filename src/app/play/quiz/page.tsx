"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Button } from "~/components/ui/button";
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
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { useSession } from "next-auth/react";
import AuthDialog from "~/components/auth/auth-dialog";
import ReactConfetti from "react-confetti";
import { useWindowSize } from "react-use";
import Link from "next/link";
import { useFingerprint } from "~/app/hooks/useFingerprint";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { cn } from "~/lib/utils";
import { useRandomQuizPunchline } from "~/app/hooks/useGame";
import type { SafeQuizPunchline } from "~/app/actions/game";

const MAX_FREE_PLAYS = 3;
const PLAYS_RESET_HOURS = 24;

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
          Du hast alle verfügbaren Quiz Punchlines gelöst!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-4 text-center md:px-6">
        <div className="space-y-4">
          <p className="text-lg font-medium">Du bist ein wahrer Rap-Experte!</p>
          <p className="text-muted-foreground">
            Wir arbeiten bereits an neuen Quiz Punchlines für dich. Schau bald wieder
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

interface ArtistOption {
  id: string;
  name: string;
  image: string | null;
  isCorrect: boolean;
}

function ArtistButton({ 
  artist, 
  onClick, 
  disabled, 
  revealed,
  selected,
}: { 
  artist: ArtistOption; 
  onClick: () => void; 
  disabled: boolean;
  revealed: boolean;
  selected: boolean;
}) {
  return (
    <Button
      variant="outline"
      className={cn(
        "h-auto w-full justify-start gap-3 p-3 transition-all duration-500",
        revealed && artist.isCorrect && "border-green-500 bg-green-500/10 text-green-500",
        revealed && !artist.isCorrect && "border-destructive bg-destructive/10 text-destructive",
        selected && !revealed && "border-primary bg-primary/10",
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <Avatar className="h-10 w-10">
        <AvatarImage src={artist.image as string | undefined} />
        <AvatarFallback>
          {artist.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <span className="text-left font-medium">{artist.name}</span>
    </Button>
  );
}

export default function QuizPage() {
  const { fingerprint, isLoading: isFingerprintLoading } = useFingerprint();
  const { toast } = useToast();
  const { data: session, status } = useSession();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const { width, height } = useWindowSize();
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const { data: punchline, isLoading, error, refetch } = useRandomQuizPunchline(fingerprint ?? undefined);

  const artists = useMemo(() => {
    if (!punchline) return [];
    return [
      { ...punchline.correctArtist, isCorrect: true },
      ...punchline.wrongArtists.map(artist => ({ ...artist, isCorrect: false })),
    ].sort(() => Math.random() - 0.5);
  }, [punchline]);

  // Track when a new quiz punchline is loaded
  useEffect(() => {
    if (fingerprint && punchline) {
      // Track when user starts a quiz game
      const formData = new FormData();
      formData.append("fingerprint", fingerprint);
      formData.append("type", "quiz_play");
      formData.append("punchlineId", punchline.id.toString());
      fetch("/api/track", {
        method: "POST",
        body: formData,
      }).catch(console.error);
    }
  }, [fingerprint, punchline]);

  const handleArtistSelect = async (artistId: string) => {
    if (isRevealing || isAnswerRevealed || !punchline || !fingerprint) return;

    setSelectedArtistId(artistId);
    setIsRevealing(true);

    // Track the play attempt
    try {
      const formData = new FormData();
      formData.append("fingerprint", fingerprint);
      formData.append("type", "quiz_play");
      formData.append("punchlineId", punchline.id.toString());
      formData.append("artistId", artistId);
      await fetch("/api/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          fingerprint,
          type: "quiz_play",
          punchlineId: punchline.id.toString(),
          artistId,
        }),
      });
      setPlayCount(prev => prev + 1);
    } catch (error) {
      console.error("Failed to track play:", error);
    }

    // Delay the reveal for suspense
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const isCorrect = artistId === punchline.correctArtist.id;
    setIsAnswerRevealed(true);
    setIsRevealing(false);

    if (isCorrect) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      toast({
        title: "Richtig!",
        description: "Das war der richtige Künstler!",
      });

      // Track correct guess
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            fingerprint,
            type: "quiz_correct_guess",
            punchlineId: punchline.id.toString(),
          }),
        });
      } catch (error) {
        console.error("Failed to track correct guess:", error);
      }
    } else {
      setWrongAttempts(prev => prev + 1);
      toast({
        title: "Falsch!",
        description: "Das war leider nicht der richtige Künstler.",
        variant: "destructive",
      });

      // Track incorrect guess
      try {
        await fetch("/api/track", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            fingerprint,
            type: "quiz_incorrect_guess",
            punchlineId: punchline.id.toString(),
            artistId,
          }),
        });
      } catch (error) {
        console.error("Failed to track incorrect guess:", error);
      }
    }
  };

  const handleNext = () => {
    setSelectedArtistId(null);
    setIsAnswerRevealed(false);
    setWrongAttempts(0);
    setShowSolution(false);
    refetch();
  };

  // Show auth prompt if user has exceeded free plays
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
                trigger={
                  <Button variant="outline" className="w-full">
                    Anmelden
                  </Button>
                }
                callbackUrl="/play/quiz"
              />
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading || isFingerprintLoading) {
    return (
      <div className="container flex items-center justify-center">
        <Card className="w-full md:p-2">
          <CardHeader className="px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-6">
            <CardTitle className="text-lg md:text-2xl">
              <Skeleton className="h-8 w-3/4" />
            </CardTitle>
            <CardDescription>
              <Skeleton className="h-4 w-1/2" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 md:space-y-6 md:px-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container flex items-center justify-center">
        <Alert variant="destructive">
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>
            Beim Laden der Quiz Punchline ist ein Fehler aufgetreten.
            Bitte versuche es später erneut.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!punchline) {
    return <WinningScreen />;
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
            <CardHeader className="px-3 pb-2 pt-3 md:px-6 md:pb-6 md:pt-6">
              <CardTitle className="text-base md:text-2xl">
                Von welchem Künstler stammt diese Punchline?
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Wähle den richtigen Künstler aus den drei Optionen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-3 md:space-y-6 md:px-6">
              <div className={`grid gap-3 md:gap-6 ${isAnswerRevealed ? "grid-cols-1 md:grid-cols-[1fr,300px]" : "grid-cols-1"}`}>
                <div className="space-y-4 md:space-y-6">
                  <h3 className="text-xs font-medium text-muted-foreground md:text-base">
                    Punchline:
                  </h3>
                  <p className="text-lg font-bold leading-normal md:text-4xl">
                    {formatPunchlineText(punchline.line)}
                  </p>

                  <div className="space-y-2 md:space-y-3">
                    {artists.map((artist) => (
                      <ArtistButton
                        key={artist.id}
                        artist={artist}
                        onClick={() => handleArtistSelect(artist.id)}
                        disabled={isRevealing || isAnswerRevealed}
                        revealed={isAnswerRevealed}
                        selected={artist.id === selectedArtistId}
                      />
                    ))}
                  </div>

                  {isAnswerRevealed && (
                    <div className="flex justify-center">
                      <Button
                        size="default"
                        className={cn(
                          "md:size-lg shadow-lg transition-all hover:shadow-xl",
                          selectedArtistId === punchline.correctArtist.id
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : ""
                        )}
                        onClick={handleNext}
                      >
                        Nächste Punchline →
                      </Button>
                    </div>
                  )}

                  {!isAnswerRevealed && wrongAttempts >= 3 && (
                    <div className="space-y-2 duration-500 animate-in slide-in-from-bottom md:space-y-4">
                      <div className="flex flex-col items-center gap-2 md:gap-3">
                        <p className="text-center text-xs text-muted-foreground md:text-base">
                          Du hast alle Versuche aufgebraucht. Möchtest du
                          die Lösung sehen?
                        </p>
                        <Button
                          size="default"
                          variant="outline"
                          className="md:size-lg"
                          onClick={() => {
                            setSelectedArtistId(punchline.correctArtist.id);
                            setIsAnswerRevealed(true);
                            setShowSolution(true);
                          }}
                        >
                          Lösung anzeigen
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {isAnswerRevealed && (
                  <div className="h-fit space-y-2 rounded-lg border p-2 duration-500 animate-in slide-in-from-bottom md:p-4 md:slide-in-from-right">
                    <h3 className="text-xs font-semibold md:text-base">
                      Song:
                    </h3>
                    <div className="space-y-2 md:space-y-4">
                      {punchline.song.album.image && (
                        <div className="relative mx-auto aspect-square w-24 overflow-hidden rounded-md md:mx-0 md:w-full">
                          <img
                            src={punchline.song.album.image}
                            alt={`${punchline.song.album.name} Cover`}
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium md:text-base">
                          {punchline.song.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {punchline.song.artist.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Album: {punchline.song.album.name}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 px-3 pb-3 md:px-6 md:pb-6">
              {(!isAnswerRevealed || selectedArtistId !== punchline.correctArtist.id) && (
                <Button
                  variant="outline"
                  onClick={handleNext}
                  className="flex-1 text-xs md:text-base"
                >
                  <RefreshCw className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                  Überspringen
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
} 