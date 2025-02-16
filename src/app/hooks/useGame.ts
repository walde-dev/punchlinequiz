import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRandomPunchline, validateGuess } from "../actions/game";
import { type Punchline } from "../actions/punchlines";

type RandomPunchline = Omit<Punchline, "perfectSolution" | "acceptableSolutions"> & {
  acceptableSolutions: string[];
};

export function useRandomPunchline() {
  return useQuery({
    queryKey: ["randomPunchline"] as const,
    queryFn: async () => {
      const punchline = await getRandomPunchline();
      if (!punchline) { 
        throw new Error("Failed to fetch random punchline");
      }
      return punchline as RandomPunchline;
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
    onSuccess: () => {
      // If the guess was correct, we'll want to fetch a new punchline
      queryClient.invalidateQueries({ queryKey: ["randomPunchline"] });
    },
  });
} 