export interface CustomUserProfile {
  name?: string;
  preferences?: string[];
  calorieGoal?: number;
  macroGoals?: {
    protein: number;
    fat: number;
    carbs: number;
  };
  profileImage?: string;
  swipeOnboardingCompleted?: boolean;
}

export interface CustomUser {
  _id?: string;
  username?: string;
  profile?: CustomUserProfile;
}

export interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}
