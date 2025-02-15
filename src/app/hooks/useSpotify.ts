import { useMutation, useQuery } from "@tanstack/react-query";
import { importSong, searchSongs } from "../actions/spotify";

export function useSpotifySearch(query: string) {
  const isEnabled = typeof query === 'string' && query.length >= 3;
  
  return useQuery({
    queryKey: ["spotify-search", query],
    queryFn: async ({ queryKey }) => {
      const [_, searchQuery] = queryKey as [string, string];
      
      if (!searchQuery || searchQuery.length < 3) {
        return [];
      }

      try {
        const results = await searchSongs(searchQuery);
        return results ?? [];
      } catch (error) {
        throw error;
      }
    },
    enabled: isEnabled,
    initialData: [],
    gcTime: 0,
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

export function useImportSong() {
  return useMutation({
    mutationFn: importSong,
  });
}
