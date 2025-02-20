import { useMutation, useQuery } from "@tanstack/react-query";
import { importSong, searchSongs, searchArtists } from "../actions/spotify";

export function useSpotifySearch(query: string) {
  return useQuery({
    queryKey: ["spotifySearch", query] as const,
    queryFn: async () => {
      if (!query || query.length <= 3) return [];
      return searchSongs(query);
    },
    enabled: query.length > 3,
  });
}

export function useSearchArtists(query: string) {
  return useQuery({
    queryKey: ["spotifyArtists", query] as const,
    queryFn: async () => {
      if (!query || query.length <= 3) return [];
      return searchArtists(query);
    },
    enabled: query.length > 3,
  });
}

export function useImportSong() {
  return useMutation({
    mutationFn: async (songId: string) => {
      return importSong(songId);
    },
  });
}
