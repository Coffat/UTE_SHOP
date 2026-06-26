import { api } from "../../lib/api";

export interface UserProfile {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  isActive?: boolean;
}

export interface UserProfileStats {
  notifications: {
    unread: number;
  };
  operations: {
    ordersHandled: number;
    activityLast7Days: number;
  };
  performance: {
    score: number | null;
  };
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const response = await api.get("/api/v1/users/profile");
  return response.data.data as UserProfile;
}

export async function updateUserProfile(payload: {
  fullName?: string;
  phone?: string;
}): Promise<UserProfile> {
  const response = await api.put("/api/v1/users/profile", payload);
  return response.data.data as UserProfile;
}

export async function changeUserPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.post("/api/v1/users/change-password", payload);
}

export async function fetchUserProfileStats(): Promise<UserProfileStats> {
  const response = await api.get("/api/v1/users/profile/stats");
  return response.data.data as UserProfileStats;
}
