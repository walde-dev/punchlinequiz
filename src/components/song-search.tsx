"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
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
import { useSpotifySearch, useImportSong } from "~/app/hooks/useSpotify";
import { useDebounce } from "~/app/hooks/useDebounce";

interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  image?: string;
}

interface SongSearchProps {
  onSelect: (song: Song) => void;
}

export function SongSearch({ onSelect }: SongSearchProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 300);

  const { data, isLoading, isError } = useSpotifySearch(debouncedQuery);
  const songs = Array.isArray(data) ? data : [];
  const importMutation = useImportSong();

  const handleSelect = async (songId: string) => {
    try {
      const song = await importMutation.mutateAsync(songId);
      if (song) {
        onSelect(song);
        setOpen(false);
        setQuery("");
      }
    } catch (error) {
      console.error("Failed to import song:", error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {"Song suchen..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Song suchen..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : isError ? (
              <CommandEmpty>Fehler beim Suchen</CommandEmpty>
            ) : songs.length === 0 ? (
              <CommandEmpty>Keine Songs gefunden</CommandEmpty>
            ) : (
              <CommandGroup>
                {songs.map((song) => (
                  <CommandItem
                    key={song.id}
                    value={song.id}
                    onSelect={handleSelect}
                  >
                    <div className="flex items-center gap-3">
                      {song.image && (
                        <img
                          src={song.image}
                          alt={song.name}
                          className="h-10 w-10 rounded-sm object-cover"
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium">{song.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {song.artist} • {song.album}
                        </span>
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
