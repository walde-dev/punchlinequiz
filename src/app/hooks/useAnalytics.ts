import { useQuery } from "@tanstack/react-query";
import { getPunchlineAnalytics, getOverallStats } from "../actions/analytics";

export function usePunchlineAnalytics() {
  return useQuery({
    queryKey: ["punchlineAnalytics"] as const,
    queryFn: async () => {
      const analytics = await getPunchlineAnalytics();
      if (!Array.isArray(analytics)) {
        throw new Error("Failed to fetch punchline analytics");
      }
      return analytics;
    },
  });
}

export function useOverallStats() {
  return useQuery({
    queryKey: ["overallStats"] as const,
    queryFn: async () => {
      const stats = await getOverallStats();
      if (!stats) {
        throw new Error("Failed to fetch overall stats");
      }
      return stats;
    },
  });
} 