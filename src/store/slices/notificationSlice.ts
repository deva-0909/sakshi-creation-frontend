import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { notificationService, Notification } from "@/services/notification.service";

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const getMyNotificationsThunk = createAsyncThunk(
  "notification/getMine",
  async (params: { unreadOnly?: boolean; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await notificationService.getMyNotifications(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue("Invalid response format: notifications array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch notifications");
    }
  }
);

export const getUnreadCountThunk = createAsyncThunk("notification/getUnreadCount", async (_: void, { rejectWithValue }) => {
  try {
    const response = await notificationService.getUnreadCount();
    if (response.success && response.data) return response.data.unreadCount;
    return rejectWithValue(response.message || "Failed to fetch unread count");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch unread count");
  }
});

export const markAsReadThunk = createAsyncThunk("notification/markAsRead", async (id: string, { rejectWithValue }) => {
  try {
    const response = await notificationService.markAsRead(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to mark notification as read");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to mark notification as read");
  }
});

export const markAllAsReadThunk = createAsyncThunk("notification/markAllAsRead", async (_: void, { rejectWithValue }) => {
  try {
    const response = await notificationService.markAllAsRead();
    if (response.success) return true;
    return rejectWithValue(response.message || "Failed to mark all notifications as read");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to mark all notifications as read");
  }
});

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearNotificationError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyNotificationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyNotificationsThunk.fulfilled, (state, action: PayloadAction<Notification[]>) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(getMyNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getUnreadCountThunk.fulfilled, (state, action: PayloadAction<number>) => {
        state.unreadCount = action.payload;
      })
      .addCase(markAsReadThunk.fulfilled, (state, action: PayloadAction<string>) => {
        const row = state.notifications.find((n) => n._id === action.payload);
        if (row && !row.isRead) {
          row.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllAsReadThunk.fulfilled, (state) => {
        state.notifications.forEach((n) => (n.isRead = true));
        state.unreadCount = 0;
      });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice.reducer;
