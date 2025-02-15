import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Punchline, createPunchline, getPunchlines } from "../actions/punchlines";

export function usePunchlines() {
  return useQuery({
    queryKey: ["punchlines"] as const,
    queryFn: async () => {
      const punchlines = await getPunchlines();
      if (!Array.isArray(punchlines)) {
        throw new Error("Failed to fetch punchlines");
      }
      return punchlines as Punchline[];
    },
  });
}

export function useCreatePunchline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      await createPunchline(formData);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
    },
  });
} 