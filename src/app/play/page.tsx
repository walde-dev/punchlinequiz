"use client";

import { useRef, useState } from "react";
import { useRandomPunchline, useValidateGuess } from "../hooks/useGame";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Skeleton } from "~/components/ui/skeleton";
import { useToast } from "~/components/ui/use-toast";
import { CheckCircle2, XCircle } from "lucide-react";

export default function PlayPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const { data: punchline, isLoading, isError } = useRandomPunchline();
  const mutation = useValidateGuess();
  const { toast } = useToast();
  const [lastGuess, setLastGuess] = useState<{
    isCorrect: boolean;
    perfectSolution?: string;
  } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const result = await mutation.mutateAsync(formData);
      setLastGuess(result);
      
      if (result.isCorrect) {
        toast({
          title: "Richtig!",
          description: `Die perfekte Lösung war: "${result.perfectSolution}"`,
        });
        formRef.current?.reset();
        setLastGuess(null);
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
        description: error instanceof Error ? error.message : "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
      });
    }
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Fehler</AlertTitle>
        <AlertDescription>
          Die Punchline konnte nicht geladen werden. Bitte versuche es später erneut.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container max-w-2xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>Punchline Quiz</CardTitle>
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
                <p className="text-lg">{punchline.line}</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Song:</h3>
                <p>
                  {punchline.song.name} - {punchline.song.artist.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Album: {punchline.song.album.name}
                </p>
              </div>
            </>
          ) : null}
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} ref={formRef} className="w-full space-y-4">
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
                disabled={isLoading || mutation.isPending}
                autoComplete="off"
              />
              <Button type="submit" disabled={isLoading || mutation.isPending}>
                {mutation.isPending ? "Prüfe..." : "Prüfen"}
              </Button>
            </div>
            {lastGuess && !lastGuess.isCorrect && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Falsch</AlertTitle>
                <AlertDescription>
                  Das war leider nicht die richtige Lösung. Versuche es noch einmal!
                </AlertDescription>
              </Alert>
            )}
          </form>
        </CardFooter>
      </Card>
    </div>
  );
} 