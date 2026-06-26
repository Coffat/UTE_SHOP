import NotificationPreference, {
  INotificationPreference,
  NotificationTypePreference,
} from '../models/NotificationPreference.js';

export interface NotificationPreferencesDto {
  channels: {
    inAppEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
  };
  types: Record<string, NotificationTypePreference>;
  ui: {
    sidebarAutoCollapse: boolean;
  };
}

export interface NotificationPreferencesPatch {
  channels?: Partial<NotificationPreferencesDto['channels']>;
  types?: Record<string, NotificationTypePreference>;
  ui?: Partial<NotificationPreferencesDto['ui']>;
}

const normalizeTypes = (
  types: Record<string, NotificationTypePreference> | undefined
): Record<string, NotificationTypePreference> => {
  if (!types) return {};
  return Object.entries(types).reduce<Record<string, NotificationTypePreference>>((acc, [type, value]) => {
    if (!value || typeof value !== 'object') return acc;
    acc[type] = {};
    if (typeof value.inAppEnabled === 'boolean') {
      acc[type].inAppEnabled = value.inAppEnabled;
    }
    if (typeof value.emailEnabled === 'boolean') {
      acc[type].emailEnabled = value.emailEnabled;
    }
    return acc;
  }, {});
};

const toDto = (doc: INotificationPreference): NotificationPreferencesDto => ({
  channels: {
    inAppEnabled: doc.channels?.inAppEnabled ?? true,
    emailEnabled: doc.channels?.emailEnabled ?? true,
    pushEnabled: doc.channels?.pushEnabled ?? false,
  },
  types: normalizeTypes(doc.types as Record<string, NotificationTypePreference>),
  ui: {
    sidebarAutoCollapse: doc.ui?.sidebarAutoCollapse ?? true,
  },
});

export const getOrCreateNotificationPreferences = async (userId: string) => {
  const doc = await NotificationPreference.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc!;
};

export const getNotificationPreferences = async (userId: string): Promise<NotificationPreferencesDto> => {
  const doc = await getOrCreateNotificationPreferences(userId);
  return toDto(doc);
};

export const updateNotificationPreferences = async (
  userId: string,
  patch: NotificationPreferencesPatch
): Promise<NotificationPreferencesDto> => {
  const doc = await getOrCreateNotificationPreferences(userId);
  const current = toDto(doc);

  const next: NotificationPreferencesDto = {
    channels: {
      ...current.channels,
      ...(patch.channels || {}),
    },
    types: {
      ...current.types,
      ...normalizeTypes(patch.types),
    },
    ui: {
      ...current.ui,
      ...(patch.ui || {}),
    },
  };

  doc.channels.inAppEnabled = next.channels.inAppEnabled;
  doc.channels.emailEnabled = next.channels.emailEnabled;
  doc.channels.pushEnabled = next.channels.pushEnabled;
  doc.types = next.types;
  doc.ui.sidebarAutoCollapse = next.ui.sidebarAutoCollapse;

  await doc.save();
  return toDto(doc);
};

export const getNotificationPreferencesMap = async (
  userIds: string[]
): Promise<Map<string, NotificationPreferencesDto>> => {
  const uniqueUserIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueUserIds.length === 0) return new Map();

  const docs = await NotificationPreference.find({ user: { $in: uniqueUserIds } });
  const map = new Map<string, NotificationPreferencesDto>();
  docs.forEach((doc) => {
    map.set(doc.user.toString(), toDto(doc));
  });

  const missingUserIds = uniqueUserIds.filter((userId) => !map.has(userId));
  if (missingUserIds.length > 0) {
    await Promise.all(missingUserIds.map((userId) => getOrCreateNotificationPreferences(userId)));
    const filled = await NotificationPreference.find({ user: { $in: missingUserIds } });
    filled.forEach((doc) => map.set(doc.user.toString(), toDto(doc)));
  }

  return map;
};

