"use client";

import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import { useCreatePunchline, useUpdatePunchline } from "../hooks/usePunchlines";
import { SongSearch } from "~/components/song-search";
import { TagInput } from "~/components/ui/tag-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useSearchArtists } from "../hooks/useSpotify";
import { useDebounce } from "../hooks/useDebounce";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useCreateQuizPunchline } from "../hooks/useQuiz";

interface Artist {
  id: string;
  name: string;
  image?: string;
}

interface PunchlineFormProps {
  onSuccess?: () => void;
  initialData?: {
    id: number;
    line: string;
    perfectSolution: string;
    acceptableSolutions: string[];
    song: {
      id: string;
      name: string;
      artist: {
        name: string;
      };
      album: {
        name: string;
      };
    };
  };
}

export default function PunchlineForm({ onSuccess, initialData }: PunchlineFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const createMutation = useCreatePunchline();
  const updateMutation = useUpdatePunchline();
  const createQuizMutation = useCreateQuizPunchline();
  const [selectedSong, setSelectedSong] = useState<{
    id: string;
    name: string;
    artist: string;
    album: string;
  } | null>(initialData ? {
    id: initialData.song.id,
    name: initialData.song.name,
    artist: initialData.song.artist.name,
    album: initialData.song.album.name,
  } : null);
  const [acceptableSolutions, setAcceptableSolutions] = useState<string[]>(
    initialData?.acceptableSolutions ?? []
  );
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  // Quiz form state
  const [artistSearch, setArtistSearch] = useState("");
  const debouncedArtistSearch = useDebounce(artistSearch, 300);
  const { data: artists = [], isLoading: isLoadingArtists } = useSearchArtists(debouncedArtistSearch);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [correctArtistId, setCorrectArtistId] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("acceptableSolutions", acceptableSolutions.join(","));
    if (initialData) {
      formData.set("id", initialData.id.toString());
    }

    try {
      if (initialData) {
        await updateMutation.mutateAsync(formData);
      } else {
        await createMutation.mutateAsync(formData);
      }
      toast({
        title: "Erfolgreich",
        description: `Punchline wurde erfolgreich ${initialData ? "aktualisiert" : "hinzugefügt"}!`,
      });
      formRef.current?.reset();
      setSelectedSong(null);
      setAcceptableSolutions([]);
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error instanceof Error ? error.message : "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
      });
    }
  }

  const handleArtistSelect = (artist: Artist) => {
    if (selectedArtists.length < 3 && !selectedArtists.some(a => a.id === artist.id)) {
      setSelectedArtists([...selectedArtists, artist]);
      if (selectedArtists.length === 0) {
        setCorrectArtistId(artist.id);
      }
    }
  };

  const handleArtistRemove = (artistId: string) => {
    setSelectedArtists(selectedArtists.filter(a => a.id !== artistId));
    if (correctArtistId === artistId) {
      setCorrectArtistId("");
    }
  };

  async function handleQuizSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Add the selected artists to the form data
    formData.set("correctArtistId", correctArtistId);
    const wrongArtists = selectedArtists.filter(a => a.id !== correctArtistId);
    formData.set("wrongArtist1Id", wrongArtists[0]?.id ?? "");
    formData.set("wrongArtist2Id", wrongArtists[1]?.id ?? "");

    try {
      await createQuizMutation.mutateAsync(formData);
      toast({
        title: "Erfolgreich",
        description: "Quiz Punchline wurde erfolgreich hinzugefügt!",
      });
      formRef.current?.reset();
      setSelectedSong(null);
      setSelectedArtists([]);
      setCorrectArtistId("");
      onSuccess?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: error instanceof Error ? error.message : "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
      });
    }
  }

  return (
    <Tabs defaultValue="finishing-lines" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="finishing-lines">Finishing Lines</TabsTrigger>
        <TabsTrigger value="quiz">Quiz</TabsTrigger>
      </TabsList>

      <TabsContent value="finishing-lines">
        <form onSubmit={handleSubmit} ref={formRef} className="space-y-6">
          <div className="space-y-2">
            <Label>Song</Label>
            <SongSearch onSelect={setSelectedSong} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="line">Punchline</Label>
            <Textarea
              id="line"
              name="line"
              placeholder="Gib die Punchline ein, verwende [...] für den zu erratenden Teil"
              required
              className="min-h-[100px]"
              disabled={initialData ? updateMutation.isPending : createMutation.isPending}
              defaultValue={initialData?.line}
            />
            <p className="text-sm text-muted-foreground">
              Beispiel: &ldquo;Ich hab&apos; den [Flow] wie Wasser, ihr seid nur Pfützen&rdquo;. Verwende / für einen Zeilenumbruch.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="perfectSolution">Perfekte Lösung</Label>
            <Input
              id="perfectSolution"
              name="perfectSolution"
              placeholder="Die exakte Lösung"
              required
              disabled={initialData ? updateMutation.isPending : createMutation.isPending}
              defaultValue={initialData?.perfectSolution}
            />
            <p className="text-sm text-muted-foreground">
              Die exakte Lösung, wie sie im Song vorkommt
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="acceptableSolutions">Akzeptierte Lösungen</Label>
            <TagInput
              id="acceptableSolutions"
              name="acceptableSolutions"
              placeholder="Drücke Enter um eine Lösung hinzuzufügen"
              value={acceptableSolutions}
              onChange={(value) => {
                setAcceptableSolutions(value);
                if (value.length === 0) {
                  setErrors((prev) => ({
                    ...prev,
                    acceptableSolutions: "Mindestens eine akzeptierte Lösung ist erforderlich",
                  }));
                } else {
                  setErrors((prev) => ({
                    ...prev,
                    acceptableSolutions: undefined,
                  }));
                }
              }}
            />
            {errors.acceptableSolutions && (
              <p className="text-sm text-destructive">{errors.acceptableSolutions}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Füge hier alle akzeptierten Lösungen hinzu. Die &ldquo;perfekte Lösung&rdquo; wird automatisch hinzugefügt.
            </p>
          </div>

          <input
            type="hidden"
            name="songId"
            value={selectedSong?.id ?? ""}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="artist">Künstler</Label>
              <Input
                id="artist"
                name="artist"
                value={selectedSong?.artist ?? ""}
                required
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="songName">Songname</Label>
              <Input
                id="songName"
                name="songName"
                value={selectedSong?.name ?? ""}
                required
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="albumName">Albumname</Label>
            <Input
              id="albumName"
              name="albumName"
              value={selectedSong?.album ?? ""}
              disabled
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={
              (initialData ? updateMutation.isPending : createMutation.isPending) || 
              !selectedSong
            }
          >
            {initialData
              ? updateMutation.isPending
                ? "Wird aktualisiert..."
                : "Punchline aktualisieren"
              : createMutation.isPending
                ? "Wird hinzugefügt..."
                : "Punchline hinzufügen"}
          </Button>
        </form>
      </TabsContent>

      <TabsContent value="quiz">
        <form onSubmit={handleQuizSubmit} ref={formRef} className="space-y-6">
          <div className="space-y-2">
            <Label>Song</Label>
            <SongSearch onSelect={setSelectedSong} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="line">Punchline</Label>
            <Textarea
              id="line"
              name="line"
              placeholder="Gib die vollständige Punchline ein"
              required
              className="min-h-[100px]"
            />
            <p className="text-sm text-muted-foreground">
              Gib die Punchline exakt so ein, wie sie im Song vorkommt.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Künstler Auswahl</Label>
            <div className="space-y-4">
              <Input
                placeholder="Suche nach Künstlern..."
                value={artistSearch}
                onChange={(e) => setArtistSearch(e.target.value)}
              />

              {isLoadingArtists ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {artists.map((artist) => (
                    <Button
                      key={artist.id}
                      type="button"
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleArtistSelect(artist)}
                      disabled={selectedArtists.length >= 3 || selectedArtists.some(a => a.id === artist.id)}
                    >
                      <Avatar className="mr-2 h-6 w-6">
                        <AvatarImage src={artist.image} />
                        <AvatarFallback>{artist.name[0]}</AvatarFallback>
                      </Avatar>
                      {artist.name}
                    </Button>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Ausgewählte Künstler</Label>
                {selectedArtists.length > 0 ? (
                  <RadioGroup value={correctArtistId} onValueChange={setCorrectArtistId}>
                    {selectedArtists.map((artist) => (
                      <div key={artist.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={artist.id} id={artist.id} />
                        <div className="flex flex-1 items-center justify-between">
                          <Label htmlFor={artist.id} className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={artist.image} />
                              <AvatarFallback>{artist.name[0]}</AvatarFallback>
                            </Avatar>
                            {artist.name}
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleArtistRemove(artist.id)}
                          >
                            Entfernen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Noch keine Künstler ausgewählt
                  </p>
                )}
              </div>
            </div>
          </div>

          <input
            type="hidden"
            name="songId"
            value={selectedSong?.id ?? ""}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={
              createQuizMutation.isPending ||
              !selectedSong ||
              selectedArtists.length !== 3 ||
              !correctArtistId
            }
          >
            {createQuizMutation.isPending
              ? "Wird hinzugefügt..."
              : "Quiz Punchline hinzufügen"}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
} 