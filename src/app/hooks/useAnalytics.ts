import { useQuery } from "@tanstack/react-query";
import { 
  getPunchlineAnalytics, 
  getOverallStats, 
  getAnonymousStats,
  type TimeSpan 
} from "../actions/analytics";

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

export function useOverallStats(timeSpan: TimeSpan = "24h") {
  return useQuery({
    queryKey: ["overallStats", timeSpan] as const,
    queryFn: async () => {
      const stats = await getOverallStats(timeSpan);
      if (!stats) {
        throw new Error("Failed to fetch overall stats");
      }
      return stats;
    },
  });
}

export function useAnonymousStats(timeSpan: TimeSpan = "24h") {
  return useQuery({
    queryKey: ["anonymousStats", timeSpan] as const,
    queryFn: async () => {
      const stats = await getAnonymousStats(timeSpan);
      if (!stats) {
        throw new Error("Failed to fetch anonymous stats");
      }
      return stats;
    },
  });
} 