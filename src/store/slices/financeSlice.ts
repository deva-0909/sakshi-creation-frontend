import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { financeService, LedgerResult, AgeingBuckets, CustomerAgeingRow, VendorAgeingRow } from "@/services/finance.service";

interface FinanceState {
  customerLedger: LedgerResult | null;
  vendorLedger: LedgerResult | null;
  customerAgeing: { buckets: AgeingBuckets; rows: CustomerAgeingRow[] } | null;
  vendorAgeing: { buckets: AgeingBuckets; rows: VendorAgeingRow[] } | null;
  loading: boolean;
  error: string | null;
}

const initialState: FinanceState = {
  customerLedger: null,
  vendorLedger: null,
  customerAgeing: null,
  vendorAgeing: null,
  loading: false,
  error: null,
};

export const getCustomerLedgerThunk = createAsyncThunk(
  "finance/getCustomerLedger",
  async ({ partyId, from, to }: { partyId: string; from?: string; to?: string }, { rejectWithValue }) => {
    try {
      const response = await financeService.getCustomerLedger(partyId, { from, to });
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to fetch customer ledger");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch customer ledger");
    }
  }
);

export const getVendorLedgerThunk = createAsyncThunk(
  "finance/getVendorLedger",
  async ({ vendorId, from, to }: { vendorId: string; from?: string; to?: string }, { rejectWithValue }) => {
    try {
      const response = await financeService.getVendorLedger(vendorId, { from, to });
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to fetch vendor ledger");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch vendor ledger");
    }
  }
);

export const getCustomerAgeingThunk = createAsyncThunk(
  "finance/getCustomerAgeing",
  async (params: { partyId?: string; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await financeService.getCustomerAgeing(params);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to fetch customer ageing");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch customer ageing");
    }
  }
);

export const getVendorAgeingThunk = createAsyncThunk(
  "finance/getVendorAgeing",
  async (params: { vendorId?: string; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await financeService.getVendorAgeing(params);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to fetch vendor ageing");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch vendor ageing");
    }
  }
);

const financeSlice = createSlice({
  name: "finance",
  initialState,
  reducers: {
    clearFinanceError(state) {
      state.error = null;
    },
    clearCustomerLedger(state) {
      state.customerLedger = null;
    },
    clearVendorLedger(state) {
      state.vendorLedger = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCustomerLedgerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomerLedgerThunk.fulfilled, (state, action: PayloadAction<LedgerResult>) => {
        state.loading = false;
        state.customerLedger = action.payload;
      })
      .addCase(getCustomerLedgerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.customerLedger = null;
      })
      .addCase(getVendorLedgerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVendorLedgerThunk.fulfilled, (state, action: PayloadAction<LedgerResult>) => {
        state.loading = false;
        state.vendorLedger = action.payload;
      })
      .addCase(getVendorLedgerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.vendorLedger = null;
      })
      .addCase(getCustomerAgeingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCustomerAgeingThunk.fulfilled, (state, action: PayloadAction<{ buckets: AgeingBuckets; rows: CustomerAgeingRow[] }>) => {
        state.loading = false;
        state.customerAgeing = action.payload;
      })
      .addCase(getCustomerAgeingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.customerAgeing = null;
      })
      .addCase(getVendorAgeingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getVendorAgeingThunk.fulfilled, (state, action: PayloadAction<{ buckets: AgeingBuckets; rows: VendorAgeingRow[] }>) => {
        state.loading = false;
        state.vendorAgeing = action.payload;
      })
      .addCase(getVendorAgeingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.vendorAgeing = null;
      });
  },
});

export const { clearFinanceError, clearCustomerLedger, clearVendorLedger } = financeSlice.actions;
export default financeSlice.reducer;
