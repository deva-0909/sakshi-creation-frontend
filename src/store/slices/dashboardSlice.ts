import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { dashboardService, DashboardSummary } from "@/services/dashboard.service";

interface DashboardState {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  summary: null,
  loading: false,
  error: null,
};

export const getDashboardSummaryThunk = createAsyncThunk("dashboard/getSummary", async (_: void, { rejectWithValue }) => {
  try {
    const response = await dashboardService.getSummary();
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to fetch dashboard summary");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch dashboard summary");
  }
});

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    clearDashboardError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDashboardSummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDashboardSummaryThunk.fulfilled, (state, action: PayloadAction<DashboardSummary>) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(getDashboardSummaryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
