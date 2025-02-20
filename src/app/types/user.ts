import { type Activity } from "./activity";

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isAdmin: boolean;
  onboardingCompleted: boolean;
  createdAt: number;
  solvedCount: number;
  activities?: Activity[];
} 