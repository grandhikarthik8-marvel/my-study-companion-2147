export type SessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  avatar_url: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  subject_name: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number;
  paused_duration_seconds: number;
  status: SessionStatus;
  notes: string | null;
  created_at: string;
  cancelled_at: string | null;
  restored_at: string | null;
}

export interface Goals {
  id: string;
  user_id: string;
  daily_goal_minutes: number;
  weekly_goal_minutes: number;
  monthly_goal_minutes: number;
  updated_at: string;
}

export interface StudyStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_study_date: string | null;
  updated_at: string;
}

export interface AchievementBadge {
  id: string;
  user_id: string;
  badge_key: string;
  badge_name: string;
  badge_level: string;
  unlocked_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface GoalProgress {
  minutes: number;
  goalMinutes: number;
  percent: number;
}

export interface SubjectTotal {
  subject: string;
  minutes: number;
}

export interface HeatmapDay {
  date: string;
  label: string;
  minutes: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}
