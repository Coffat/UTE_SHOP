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
