import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { startNewGame, validateGuess } from "../actions/game";
import type { Punchline } from "../actions/punchlines";

export function useRandomPunchline(fingerprint?: string) {
  return useQuery({
    queryKey: ["randomPunchline", fingerprint] as const,
    queryFn: async () => {
      const punchline = await startNewGame(fingerprint ?? "");
      if (!punchline) { 
        throw new Error("Failed to fetch random punchline");
      }
      return punchline;
    },
  });
}

export function useValidateGuess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await validateGuess(formData);
      return result;
    },
    onSuccess: (data) => {
      // Only invalidate if the guess was correct
      if (data.isCorrect) {
        queryClient.invalidateQueries({ queryKey: ["randomPunchline"] });
      }
    },
  });
} 