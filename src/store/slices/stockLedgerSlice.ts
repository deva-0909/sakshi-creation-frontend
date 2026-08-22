import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { stockLedgerService, MaterialLedger, StockSummaryEntry } from "@/services/stockLedger.service";

interface StockLedgerState {
  ledger: MaterialLedger | null;
  summary: StockSummaryEntry[];
  loading: boolean;
  summaryLoading: boolean;
  error: string | null;
}

const initialState: StockLedgerState = {
  ledger: null,
  summary: [],
  loading: false,
  summaryLoading: false,
  error: null,
};

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
    },
  },
  extraReducers: (builder) => {
    builder
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
