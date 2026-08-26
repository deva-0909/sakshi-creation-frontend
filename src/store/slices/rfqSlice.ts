import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import { rfqService, Rfq, RfqVendorQuote } from "@/services/rfq.service";

interface RfqState {
  rfqs: Rfq[];
  singleRfq: Rfq | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: RfqState = {
  rfqs: [],
  singleRfq: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

interface CreateRfqData {
  companyName: string;
  notes?: string;
  items: { materialId: string; quantityNeeded: number }[];
  vendorIds: string[];
}

export const createRfqThunk = createAsyncThunk("rfq/create", async (data: CreateRfqData, { rejectWithValue }) => {
  try {
    const response = await rfqService.createRfq(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create RFQ");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create RFQ");
  }
});

export const getAllRfqsThunk = createAsyncThunk(
  "rfq/getAll",
  async (params: { status?: string; search?: string; page?: number; limit?: number; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await rfqService.getAllRfqs(params);
      if (response.success && Array.isArray(response.data)) {
        return { data: response.data, totalCount: response.pagination?.totalCount ?? response.data.length };
      }
      return rejectWithValue("Invalid response format: RFQs array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch RFQs");
    }
  }
);

export const getRfqByIdThunk = createAsyncThunk("rfq/getById", async (id: string, { rejectWithValue }) => {
  try {
    const response = await rfqService.getRfqById(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "RFQ not found");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch RFQ");
  }
});

export const deleteRfqThunk = createAsyncThunk("rfq/delete", async (id: string, { rejectWithValue }) => {
  try {
    const response = await rfqService.deleteRfq(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete RFQ");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete RFQ");
  }
});

export const sendRfqThunk = createAsyncThunk("rfq/send", async (id: string, { rejectWithValue }) => {
  try {
    const response = await rfqService.sendRfq(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to send RFQ");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to send RFQ");
  }
});

export const cancelRfqThunk = createAsyncThunk("rfq/cancel", async (id: string, { rejectWithValue }) => {
  try {
    const response = await rfqService.cancelRfq(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to cancel RFQ");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to cancel RFQ");
  }
});

export const recordVendorQuoteThunk = createAsyncThunk(
  "rfq/recordVendorQuote",
  async ({ quoteId, items }: { quoteId: string; items: { rfqItemId: string; rate: number; notes?: string }[] }, { rejectWithValue }) => {
    try {
      const response = await rfqService.recordVendorQuote(quoteId, items);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to record vendor quote");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to record vendor quote");
    }
  }
);

const rfqSlice = createSlice({
  name: "rfq",
  initialState,
  reducers: {
    clearRfqError(state) {
      state.error = null;
    },
    clearRfqSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleRfq(state) {
      state.singleRfq = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createRfqThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createRfqThunk.fulfilled, (state, action: PayloadAction<Rfq>) => {
        state.loading = false;
        state.rfqs = [action.payload, ...state.rfqs];
        state.successMessage = "RFQ created successfully";
      })
      .addCase(createRfqThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllRfqsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllRfqsThunk.fulfilled, (state, action: PayloadAction<{ data: Rfq[]; totalCount: number }>) => {
        state.loading = false;
        state.rfqs = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(getAllRfqsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.rfqs = [];
      })
      .addCase(getRfqByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getRfqByIdThunk.fulfilled, (state, action: PayloadAction<Rfq>) => {
        state.loading = false;
        state.singleRfq = action.payload;
      })
      .addCase(getRfqByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteRfqThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.rfqs = state.rfqs.filter((r) => r._id !== action.payload);
        state.successMessage = "RFQ deleted successfully";
      })
      .addCase(deleteRfqThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(recordVendorQuoteThunk.fulfilled, (state, action: PayloadAction<RfqVendorQuote>) => {
        if (state.singleRfq?.quotes) {
          const index = state.singleRfq.quotes.findIndex((q) => q._id === action.payload._id);
          if (index !== -1) state.singleRfq.quotes[index] = action.payload;
        }
        state.successMessage = "Vendor quote recorded";
      })
      .addCase(recordVendorQuoteThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addMatcher(isAnyOf(sendRfqThunk.pending, cancelRfqThunk.pending), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(isAnyOf(sendRfqThunk.fulfilled, cancelRfqThunk.fulfilled), (state, action: PayloadAction<Rfq>) => {
        state.loading = false;
        state.singleRfq = action.payload;
        const index = state.rfqs.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) state.rfqs[index] = action.payload;
        state.successMessage = "RFQ updated successfully";
      })
      .addMatcher(isAnyOf(sendRfqThunk.rejected, cancelRfqThunk.rejected), (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearRfqError, clearRfqSuccessMessage, clearSingleRfq } = rfqSlice.actions;
export default rfqSlice.reducer;
