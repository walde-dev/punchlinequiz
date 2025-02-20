import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createQuizPunchline, deleteQuizPunchline, getQuizPunchlines, updateQuizPunchline, type QuizPunchline } from "../actions/quiz";

export function useQuizPunchlines() {
  return useQuery<QuizPunchline[], Error>({
    queryKey: ["quizPunchlines"],
    queryFn: getQuizPunchlines,
  });
}

export function useCreateQuizPunchline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      await createQuizPunchline(formData);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizPunchlines"] });
    },
  });
}

export function useUpdateQuizPunchline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      await updateQuizPunchline(formData);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizPunchlines"] });
    },
  });
}

export function useDeleteQuizPunchline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await deleteQuizPunchline(id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quizPunchlines"] });
    },
  });
} 