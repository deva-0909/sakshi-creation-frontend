import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { loginHistoryService, LoginHistoryEntry } from "@/services/loginHistory.service";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface LoginHistoryState {
  entries: LoginHistoryEntry[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
}

const initialState: LoginHistoryState = { entries: [], pagination: null, loading: false, error: null };

export const getLoginHistoryThunk = createAsyncThunk(
  "loginHistory/getAll",
  async (params: { staffId?: string; success?: boolean; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await loginHistoryService.getLoginHistory(params);
      if (response.success && Array.isArray(response.data)) return { data: response.data, pagination: response.pagination || null };
      return rejectWithValue(response.message || "Failed to fetch login history");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch login history");
    }
  }
);

const loginHistorySlice = createSlice({
  name: "loginHistory",
  initialState,
  reducers: {
    clearLoginHistoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getLoginHistoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLoginHistoryThunk.fulfilled, (state, action: PayloadAction<{ data: LoginHistoryEntry[]; pagination: Pagination | null }>) => {
        state.loading = false;
        state.entries = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(getLoginHistoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.entries = [];
      });
  },
});

export const { clearLoginHistoryError } = loginHistorySlice.actions;
export default loginHistorySlice.reducer;
