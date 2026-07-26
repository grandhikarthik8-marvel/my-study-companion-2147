import { useQuery } from "@tanstack/react-query";
import {
  fetchBadges,
  fetchGoals,
  fetchNotifications,
  fetchProfile,
  fetchRecentlyCancelled,
  fetchSessions,
  fetchStreak,
} from "@/services/studyService";

export const useProfile = () => useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
export const useGoals = () => useQuery({ queryKey: ["goals"], queryFn: fetchGoals });
export const useStreak = () => useQuery({ queryKey: ["streak"], queryFn: fetchStreak });
export const useSessions = () => useQuery({ queryKey: ["sessions"], queryFn: fetchSessions });
export const useBadges = () => useQuery({ queryKey: ["badges"], queryFn: fetchBadges });
export const useNotifications = () =>
  useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications });
export const useCancelledSessions = () =>
  useQuery({ queryKey: ["cancelled-sessions"], queryFn: fetchRecentlyCancelled });

export const STUDY_QUERY_KEYS = [
  ["profile"],
  ["goals"],
  ["streak"],
  ["sessions"],
  ["badges"],
  ["notifications"],
  ["cancelled-sessions"],
];
