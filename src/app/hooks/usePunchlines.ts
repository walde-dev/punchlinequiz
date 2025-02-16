import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type Punchline, createPunchline, getPunchlines, deletePunchline, updatePunchline } from "../actions/punchlines";

export function usePunchlines() {
  return useQuery({
    queryKey: ["punchlines"] as const,
    queryFn: async () => {
      const punchlines = await getPunchlines();
      if (!Array.isArray(punchlines)) {
        throw new Error("Failed to fetch punchlines");
      }
      // Parse the acceptableSolutions string into an array
      return punchlines.map(punchline => ({
        ...punchline,
        acceptableSolutions: JSON.parse(punchline.acceptableSolutions),
      })) as Punchline[];
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

export function useDeletePunchline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await deletePunchline(id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
    },
  });
}

export function useUpdatePunchline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      await updatePunchline(formData);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["punchlines"] });
    },
  });
}