import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { numberingConfigService, NumberingConfig, UpdateNumberingConfigData } from "@/services/numberingConfig.service";

interface NumberingConfigState {
  configs: NumberingConfig[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: NumberingConfigState = { configs: [], loading: false, error: null, successMessage: null };

export const getAllNumberingConfigsThunk = createAsyncThunk("numberingConfigs/getAll", async (_: void, { rejectWithValue }) => {
  try {
    const response = await numberingConfigService.getAllNumberingConfigs();
    if (response.success && Array.isArray(response.data)) return response.data;
    return rejectWithValue(response.message || "Failed to fetch numbering configs");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch numbering configs");
  }
});

export const updateNumberingConfigThunk = createAsyncThunk(
  "numberingConfigs/update",
  async ({ id, data }: { id: string; data: UpdateNumberingConfigData }, { rejectWithValue }) => {
    try {
      const response = await numberingConfigService.updateNumberingConfig(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update numbering config");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update numbering config");
    }
  }
);

const numberingConfigSlice = createSlice({
  name: "numberingConfigs",
  initialState,
  reducers: {
    clearNumberingConfigError(state) {
      state.error = null;
    },
    clearNumberingConfigSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllNumberingConfigsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllNumberingConfigsThunk.fulfilled, (state, action: PayloadAction<NumberingConfig[]>) => {
        state.loading = false;
        state.configs = action.payload;
      })
      .addCase(getAllNumberingConfigsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateNumberingConfigThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNumberingConfigThunk.fulfilled, (state, action: PayloadAction<NumberingConfig>) => {
        state.loading = false;
        state.configs = state.configs.map((c) => (c._id === action.payload._id ? action.payload : c));
        state.successMessage = "Numbering format updated -- applies to the next document generated";
      })
      .addCase(updateNumberingConfigThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearNumberingConfigError, clearNumberingConfigSuccessMessage } = numberingConfigSlice.actions;
export default numberingConfigSlice.reducer;
