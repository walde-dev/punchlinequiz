export type ActivityType =
  | "play"
  | "correct_guess"
  | "incorrect_guess"
  | "quiz_play"
  | "quiz_correct_guess"
  | "quiz_incorrect_guess"
  | "oauth_click"
  | "profile_update"
  | "login"
  | "logout"
  | "game_start"
  | "game_complete";

export interface Activity {
  type: ActivityType;
  timestamp: Date;
  isLoggedIn: boolean;
  guess?: string | null;
  punchline?: {
    line: string;
  };
} 