import { api } from "../../lib/api";

export interface NotificationPreferences {
  channels: {
    inAppEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
  types: Record<
    string,
    {
      inAppEnabled?: boolean;
      emailEnabled?: boolean;
    }
  >;
  ui: {
    sidebarAutoCollapse: boolean;
  };
}

export interface NotificationPreferencesPatch {
  channels?: Partial<NotificationPreferences["channels"]>;
  types?: NotificationPreferences["types"];
  ui?: Partial<NotificationPreferences["ui"]>;
}

export const fetchNotificationPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get("/api/v1/notifications/preferences");
  return response.data?.data as NotificationPreferences;
};

export const updateNotificationPreferences = async (
  payload: NotificationPreferencesPatch
): Promise<NotificationPreferences> => {
  const response = await api.patch("/api/v1/notifications/preferences", payload);
  return response.data?.data as NotificationPreferences;
};

