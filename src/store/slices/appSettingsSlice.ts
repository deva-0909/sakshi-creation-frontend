import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { appSettingsService, AppSetting } from "@/services/appSettings.service";

interface AppSettingsState {
  settings: AppSetting[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: AppSettingsState = { settings: [], loading: false, error: null, successMessage: null };

export const getAppSettingsThunk = createAsyncThunk("appSettings/getAll", async (_: void, { rejectWithValue }) => {
  try {
    const response = await appSettingsService.getAllSettings();
    if (response.success && Array.isArray(response.data)) return response.data;
    return rejectWithValue(response.message || "Failed to fetch settings");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch settings");
  }
});

export const bulkUpdateAppSettingsThunk = createAsyncThunk(
  "appSettings/bulkUpdate",
  async (settings: Record<string, string | number | null>, { rejectWithValue }) => {
    try {
      const response = await appSettingsService.updateSettingsBulk(settings);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to update settings");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update settings");
    }
  }
);

const appSettingsSlice = createSlice({
  name: "appSettings",
  initialState,
  reducers: {
    clearAppSettingsError(state) {
      state.error = null;
    },
    clearAppSettingsSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAppSettingsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAppSettingsThunk.fulfilled, (state, action: PayloadAction<AppSetting[]>) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(getAppSettingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(bulkUpdateAppSettingsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkUpdateAppSettingsThunk.fulfilled, (state, action: PayloadAction<AppSetting[]>) => {
        state.loading = false;
        state.settings = action.payload;
        state.successMessage = "Settings updated successfully";
      })
      .addCase(bulkUpdateAppSettingsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAppSettingsError, clearAppSettingsSuccessMessage } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;
