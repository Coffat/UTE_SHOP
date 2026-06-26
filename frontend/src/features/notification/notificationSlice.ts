import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { api } from '@/lib/api';

export interface UserNotification {
  _id: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  notification: {
    _id: string;
    title: string;
    body: string;
    type: string;
    referenceId?: string | null;
    actionUrl?: string;
    priority?: string;
    data?: unknown;
    createdAt: string;
  };
}

interface NotificationState {
  items: UserNotification[];
  unreadCount: number;
  nextCursor: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: NotificationState = {
  items: [],
  unreadCount: 0,
  nextCursor: null,
  status: 'idle',
  error: null,
};

interface NotificationListPayload {
  data: UserNotification[];
  nextCursor: string | null;
}

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (cursor?: string) => {
    const url = cursor ? `/api/v1/notifications?cursor=${cursor}` : '/api/v1/notifications';
    const response = await api.get(url);
    if (response.data?.success && response.data?.data) {
      return response.data.data as NotificationListPayload;
    }
    return { data: [], nextCursor: null } satisfies NotificationListPayload;
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notification/fetchUnreadCount',
  async () => {
    const response = await api.get('/api/v1/notifications/unread-count');
    return response.data?.data?.unreadCount ?? 0;
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (id: string) => {
    await api.patch(`/api/v1/notifications/${id}/read`);
    return id;
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async () => {
    await api.patch('/api/v1/notifications/read-all');
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    resetNotifications: (state) => {
      state.items = [];
      state.unreadCount = 0;
      state.nextCursor = null;
      state.status = 'idle';
      state.error = null;
    },
    // Allows injecting real-time notification
    addRealtimeNotification: (state, action: PayloadAction<UserNotification>) => {
      const exists = state.items.some((item) => item._id === action.payload._id);
      if (exists) return;
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.error = null;
        const incoming = Array.isArray(action.payload.data) ? action.payload.data : [];
        // If it's a new fetch without cursor, replace items. Else append.
        if (!action.meta.arg) {
          state.items = incoming;
        } else {
          const newItems = incoming.filter(
            (newItem) => !state.items.some((item) => item._id === newItem._id)
          );
          state.items = [...state.items, ...newItems];
        }
        state.nextCursor = action.payload.nextCursor ?? null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Failed to fetch notifications';
      })
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload || 0;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const item = state.items.find((i) => i._id === action.payload);
        if (item && !item.isRead) {
          item.isRead = true;
          item.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.items.forEach((item) => {
          if (!item.isRead) {
            item.isRead = true;
            item.readAt = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
      });
  },
});

export const { resetNotifications, addRealtimeNotification } = notificationSlice.actions;

export const notificationReducer = notificationSlice.reducer;
