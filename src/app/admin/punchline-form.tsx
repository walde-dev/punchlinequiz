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

  return (
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
  );
} 