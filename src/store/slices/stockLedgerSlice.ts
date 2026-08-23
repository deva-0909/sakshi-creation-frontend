import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { stockLedgerService, MaterialLedger, StockSummaryEntry, StockAvailability } from "@/services/stockLedger.service";

interface StockLedgerState {
  ledger: MaterialLedger | null;
  summary: StockSummaryEntry[];
  availability: StockAvailability | null;
  loading: boolean;
  summaryLoading: boolean;
  availabilityLoading: boolean;
  error: string | null;
}

const initialState: StockLedgerState = {
  ledger: null,
  summary: [],
  availability: null,
  loading: false,
  summaryLoading: false,
  availabilityLoading: false,
  error: null,
};

export const getStockAvailabilityThunk = createAsyncThunk(
  "stockLedger/getAvailability",
  async (
    { materialId, params }: { materialId: string; params?: { category?: string; warehouse?: string; companyName?: string } },
    { rejectWithValue }
  ) => {
    try {
      const response = await stockLedgerService.getAvailability(materialId, params);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to fetch stock availability");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch stock availability");
    }
  }
);

export const getMaterialLedgerThunk = createAsyncThunk(
  "stockLedger/getMaterialLedger",
  async (
    { materialId, params }: { materialId: string; params?: { category?: string; from?: string; to?: string; companyName?: string } },
    { rejectWithValue }
  ) => {
    try {
      const response = await stockLedgerService.getMaterialLedger(materialId, params);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to fetch material ledger");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch material ledger");
    }
  }
);

export const getStockSummaryThunk = createAsyncThunk(
  "stockLedger/getSummary",
  async (params: { category?: string; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await stockLedgerService.getSummary(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch stock summary");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch stock summary");
    }
  }
);

const stockLedgerSlice = createSlice({
  name: "stockLedger",
  initialState,
  reducers: {
    clearStockLedgerError(state) {
      state.error = null;
    },
    clearMaterialLedger(state) {
      state.ledger = null;
      state.availability = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getStockAvailabilityThunk.pending, (state) => {
        state.availabilityLoading = true;
      })
      .addCase(getStockAvailabilityThunk.fulfilled, (state, action: PayloadAction<StockAvailability>) => {
        state.availabilityLoading = false;
        state.availability = action.payload;
      })
      .addCase(getStockAvailabilityThunk.rejected, (state, action) => {
        state.availabilityLoading = false;
        state.error = action.payload as string;
        state.availability = null;
      })
      .addCase(getMaterialLedgerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMaterialLedgerThunk.fulfilled, (state, action: PayloadAction<MaterialLedger>) => {
        state.loading = false;
        state.ledger = action.payload;
      })
      .addCase(getMaterialLedgerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.ledger = null;
      })
      .addCase(getStockSummaryThunk.pending, (state) => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(getStockSummaryThunk.fulfilled, (state, action: PayloadAction<StockSummaryEntry[]>) => {
        state.summaryLoading = false;
        state.summary = action.payload;
      })
      .addCase(getStockSummaryThunk.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.payload as string;
        state.summary = [];
      });
  },
});

export const { clearStockLedgerError, clearMaterialLedger } = stockLedgerSlice.actions;
export default stockLedgerSlice.reducer;
