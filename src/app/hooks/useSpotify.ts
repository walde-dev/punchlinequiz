import { useMutation, useQuery } from "@tanstack/react-query";
import { importSong, searchSongs } from "../actions/spotify";

export function useSpotifySearch(query: string) {
  return useQuery({
    queryKey: ["spotify-search", query] as const,
    queryFn: async () => {
      if (!query || query.length < 3) return [];
      
      console.log("Searching for:", query); // Debug log
      try {
        const results = await searchSongs(query);
        console.log("Search results:", results); // Debug log
        return results ? (Array.isArray(results) ? results : []) : [];
      } catch (error) {
        console.error("Search error:", error);
        return [];
      }
    },
    enabled: query.length > 2,
    initialData: [],
    staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useImportSong() {
  return useMutation({
    mutationFn: importSong,
  });
}
