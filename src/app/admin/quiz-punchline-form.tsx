"use client";

import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { SongSearch } from "~/components/song-search";
import { useCreateQuizPunchline, useUpdateQuizPunchline } from "~/app/hooks/useQuiz";
import { useToast } from "~/components/ui/use-toast";
import { useSearchArtists } from "~/app/hooks/useSpotify";
import { useDebounce } from "~/app/hooks/useDebounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { ChevronsUpDown, Loader2, X } from "lucide-react";
import type { QuizPunchline } from "~/app/actions/quiz";

interface Artist {
  id: string;
  name: string;
  image: string | null;
}

interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  image?: string;
}

interface QuizPunchlineFormProps {
  punchline?: QuizPunchline | null;
  onSuccess: () => void;
}

export default function QuizPunchlineForm({ punchline, onSuccess }: QuizPunchlineFormProps) {
  const [selectedSong, setSelectedSong] = useState<QuizPunchline["song"] | null>(null);
  const [line, setLine] = useState("");
  const [artistQuery, setArtistQuery] = useState("");
  const [artistSearchOpen, setArtistSearchOpen] = useState(false);
  const [selectedArtists, setSelectedArtists] = useState<Artist[]>([]);
  const [correctArtistId, setCorrectArtistId] = useState<string | null>(null);

  const debouncedArtistQuery = useDebounce(artistQuery, 300);
  const createQuizPunchline = useCreateQuizPunchline();
  const updateQuizPunchline = useUpdateQuizPunchline();
  const { toast } = useToast();

  const {
    data: artists = [],
    isFetching: isLoadingArtists,
  } = useSearchArtists(debouncedArtistQuery);

  useEffect(() => {
    if (punchline) {
      setLine(punchline.line);
      setSelectedSong(punchline.song);
      setSelectedArtists([punchline.correctArtist, ...punchline.wrongArtists]);
      setCorrectArtistId(punchline.correctArtist.id);
    }
  }, [punchline]);

  const handleArtistSelect = (artist: Artist) => {
    if (selectedArtists.length < 3 && !selectedArtists.find(a => a.id === artist.id)) {
      setSelectedArtists([...selectedArtists, artist]);
      setArtistSearchOpen(false);
      setArtistQuery("");
    }
  };

  const handleArtistRemove = (artistId: string) => {
    setSelectedArtists(selectedArtists.filter(a => a.id !== artistId));
    if (correctArtistId === artistId) {
      setCorrectArtistId(null);
    }
  };

  const handleSongSelect = (song: Song) => {
    setSelectedSong({
      id: song.id,
      name: song.name,
      artist: {
        id: "", // We'll get this from the song's artist later
        name: song.artist,
      },
      album: {
        id: "", // We'll get this from the song's album later
        name: song.album,
        image: song.image ?? null,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSong || selectedArtists.length !== 3 || !correctArtistId) {
      return;
    }

    const wrongArtists = selectedArtists.filter(
      (artist) => artist.id !== correctArtistId
    );

    // Ensure we have exactly 2 wrong artists
    if (wrongArtists.length !== 2) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Bitte wähle genau zwei falsche Künstler aus.",
      });
      return;
    }

    const formData = new FormData();
    if (punchline) {
      formData.append("id", String(punchline.id));
    }
    formData.append("line", line);
    formData.append("songId", selectedSong.id);
    formData.append("correctArtistId", correctArtistId);
    // We know wrongArtists has exactly 2 elements at this point
    const [wrongArtist1, wrongArtist2] = wrongArtists as [Artist, Artist];
    formData.append("wrongArtist1Id", wrongArtist1.id);
    formData.append("wrongArtist2Id", wrongArtist2.id);

    try {
      if (punchline) {
        await updateQuizPunchline.mutateAsync(formData);
      } else {
        await createQuizPunchline.mutateAsync(formData);
      }
      onSuccess();
      setLine("");
      setSelectedSong(null);
      setSelectedArtists([]);
      setCorrectArtistId(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Quiz Punchline konnte nicht gespeichert werden.",
      });
    }
  };

  const isSubmitDisabled =
    !line ||
    !selectedSong ||
    selectedArtists.length !== 3 ||
    !correctArtistId ||
    createQuizPunchline.isPending ||
    updateQuizPunchline.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="line">Punchline</Label>
        <Input
          id="line"
          value={line}
          onChange={(e) => setLine(e.target.value)}
          placeholder="Gib die Punchline ein..."
        />
      </div>

      <div className="space-y-2">
        <Label>Song</Label>
        <SongSearch onSelect={handleSongSelect} />
      </div>

      <div className="space-y-2">
        <Label>Künstler (3 auswählen)</Label>
        <div className="flex flex-wrap gap-2">
          {selectedArtists.map((artist) => (
            <div
              key={artist.id}
              className="flex items-center gap-2 rounded-full border bg-background px-3 py-1"
            >
              {artist.image && (
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="h-6 w-6 rounded-full"
                />
              )}
              <span className="text-sm">{artist.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => handleArtistRemove(artist.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          {selectedArtists.length < 3 && (
            <Popover open={artistSearchOpen} onOpenChange={setArtistSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={artistSearchOpen}
                  className="h-8"
                >
                  <span>Künstler hinzufügen</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Künstler suchen..."
                    value={artistQuery}
                    onValueChange={setArtistQuery}
                  />
                  <CommandList>
                    {isLoadingArtists ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : artistQuery.length > 0 && artistQuery.length <= 3 ? (
                      <CommandEmpty>
                        Bitte gib mindestens 3 Zeichen ein...
                      </CommandEmpty>
                    ) : artists.length === 0 ? (
                      <CommandEmpty>Keine Künstler gefunden</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {artists.map((artist) => (
                          <CommandItem
                            key={artist.id}
                            value={artist.id}
                            onSelect={() => handleArtistSelect({
                              id: artist.id,
                              name: artist.name,
                              image: artist.image ?? null,
                            })}
                          >
                            <div className="flex items-center gap-3">
                              {artist.image && (
                                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                                  <img
                                    src={artist.image}
                                    alt={artist.name}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <span className="font-medium">{artist.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {selectedArtists.length === 3 && (
        <div className="space-y-2">
          <Label>Korrekter Künstler</Label>
          <RadioGroup
            value={correctArtistId ?? undefined}
            onValueChange={setCorrectArtistId}
          >
            {selectedArtists.map((artist) => (
              <div key={artist.id} className="flex items-center space-x-2">
                <RadioGroupItem value={artist.id} id={artist.id} />
                <Label htmlFor={artist.id}>{artist.name}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full"
      >
        {createQuizPunchline.isPending || updateQuizPunchline.isPending
          ? "Wird gespeichert..."
          : punchline
          ? "Speichern"
          : "Erstellen"}
      </Button>
    </form>
  );
}