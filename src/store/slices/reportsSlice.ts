import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { reportsService, DelayedJobRow, CustomerPerformanceRow, SalespersonPerformanceRow, PurchaseRateTrendRow } from "@/services/reports.service";

interface ReportsState {
  delayedJobs: DelayedJobRow[];
  customerPerformance: CustomerPerformanceRow[];
  salespersonPerformance: SalespersonPerformanceRow[];
  purchaseRateTrend: PurchaseRateTrendRow[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  delayedJobs: [],
  customerPerformance: [],
  salespersonPerformance: [],
  purchaseRateTrend: [],
  loading: false,
  error: null,
};

export const getDelayedJobsThunk = createAsyncThunk("reports/getDelayedJobs", async (params: { companyName?: string } | undefined, { rejectWithValue }) => {
  try {
    const response = await reportsService.getDelayedJobs(params);
    if (response.success) return response.data || [];
    return rejectWithValue(response.message || "Failed to fetch delayed jobs");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch delayed jobs");
  }
});

export const getCustomerPerformanceThunk = createAsyncThunk("reports/getCustomerPerformance", async (params: { companyName?: string } | undefined, { rejectWithValue }) => {
  try {
    const response = await reportsService.getCustomerPerformance(params);
    if (response.success) return response.data || [];
    return rejectWithValue(response.message || "Failed to fetch customer performance");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch customer performance");
  }
});

export const getSalespersonPerformanceThunk = createAsyncThunk("reports/getSalespersonPerformance", async (params: { companyName?: string } | undefined, { rejectWithValue }) => {
  try {
    const response = await reportsService.getSalespersonPerformance(params);
    if (response.success) return response.data || [];
    return rejectWithValue(response.message || "Failed to fetch salesperson performance");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch salesperson performance");
  }
});

export const getPurchaseRateTrendThunk = createAsyncThunk("reports/getPurchaseRateTrend", async (materialId: string | undefined, { rejectWithValue }) => {
  try {
    const response = await reportsService.getPurchaseRateTrend(materialId);
    if (response.success) return response.data || [];
    return rejectWithValue(response.message || "Failed to fetch purchase rate trend");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch purchase rate trend");
  }
});

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {
    clearReportsError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getDelayedJobsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDelayedJobsThunk.fulfilled, (state, action: PayloadAction<DelayedJobRow[]>) => {
        state.loading = false;
        state.delayedJobs = action.payload;
      })
      .addCase(getDelayedJobsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getCustomerPerformanceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomerPerformanceThunk.fulfilled, (state, action: PayloadAction<CustomerPerformanceRow[]>) => {
        state.loading = false;
        state.customerPerformance = action.payload;
      })
      .addCase(getCustomerPerformanceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getSalespersonPerformanceThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSalespersonPerformanceThunk.fulfilled, (state, action: PayloadAction<SalespersonPerformanceRow[]>) => {
        state.loading = false;
        state.salespersonPerformance = action.payload;
      })
      .addCase(getSalespersonPerformanceThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getPurchaseRateTrendThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPurchaseRateTrendThunk.fulfilled, (state, action: PayloadAction<PurchaseRateTrendRow[]>) => {
        state.loading = false;
        state.purchaseRateTrend = action.payload;
      })
      .addCase(getPurchaseRateTrendThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearReportsError } = reportsSlice.actions;
export default reportsSlice.reducer;
