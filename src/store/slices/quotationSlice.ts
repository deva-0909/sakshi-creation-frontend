import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import { quotationService, Quotation, QuotationHistoryEntry } from "@/services/quotation.service";

interface QuotationState {
  quotations: Quotation[];
  singleQuotation: Quotation | null;
  history: QuotationHistoryEntry[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: QuotationState = {
  quotations: [],
  singleQuotation: null,
  history: [],
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

interface CreateQuotationData {
  companyName: string;
  party: string;
  productItem: string;
  qty: number;
  size?: string;
  specs?: Record<string, any>;
  rateType?: string;
  rate?: number;
  printingrate?: number;
  isGst?: boolean;
  gstPercentage?: number;
  totalAmount?: number;
  validUntil?: string;
  remarks?: string;
}

export const createQuotationThunk = createAsyncThunk(
  "quotation/create",
  async (data: CreateQuotationData, { rejectWithValue }) => {
    try {
      const response = await quotationService.createQuotation(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create quotation");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create quotation");
    }
  }
);

export const getAllQuotationsThunk = createAsyncThunk(
  "quotation/getAll",
  async (params: { status?: string; search?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await quotationService.getAllQuotations(params);
      if (response.success && Array.isArray(response.data)) {
        return { data: response.data, totalCount: response.pagination?.totalCount ?? response.data.length };
      }
      return rejectWithValue("Invalid response format: quotations array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch quotations");
    }
  }
);

export const getQuotationByIdThunk = createAsyncThunk(
  "quotation/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await quotationService.getQuotationById(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Quotation not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch quotation");
    }
  }
);

export const updateQuotationThunk = createAsyncThunk(
  "quotation/update",
  async ({ id, data }: { id: string; data: Partial<CreateQuotationData> }, { rejectWithValue }) => {
    try {
      const response = await quotationService.updateQuotation(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update quotation");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update quotation");
    }
  }
);

export const deleteQuotationThunk = createAsyncThunk(
  "quotation/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await quotationService.deleteQuotation(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete quotation");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete quotation");
    }
  }
);

export const submitQuotationForApprovalThunk = createAsyncThunk(
  "quotation/submitForApproval",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await quotationService.submitForApproval(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to submit for approval");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit for approval");
    }
  }
);

export const approveQuotationThunk = createAsyncThunk(
  "quotation/approve",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await quotationService.approveQuotation(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to approve quotation");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to approve quotation");
    }
  }
);

export const rejectQuotationThunk = createAsyncThunk(
  "quotation/reject",
  async ({ id, remarks }: { id: string; remarks: string }, { rejectWithValue }) => {
    try {
      const response = await quotationService.rejectQuotation(id, remarks);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to reject quotation");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to reject quotation");
    }
  }
);

export const sendQuotationThunk = createAsyncThunk(
  "quotation/send",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await quotationService.sendQuotation(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to send quotation");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to send quotation");
    }
  }
);

export const respondQuotationThunk = createAsyncThunk(
  "quotation/respond",
  async ({ id, response: resp, remarks }: { id: string; response: "Accepted" | "Rejected"; remarks?: string }, { rejectWithValue }) => {
    try {
      const response = await quotationService.respondQuotation(id, resp, remarks);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to record response");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to record response");
    }
  }
);

export const convertQuotationThunk = createAsyncThunk(
  "quotation/convert",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await quotationService.convertQuotation(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to convert quotation");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to convert quotation");
    }
  }
);

export const getQuotationHistoryThunk = createAsyncThunk(
  "quotation/getHistory",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await quotationService.getQuotationHistory(id);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch history");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch history");
    }
  }
);

const quotationSlice = createSlice({
  name: "quotation",
  initialState,
  reducers: {
    clearQuotationError(state) {
      state.error = null;
    },
    clearQuotationSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleQuotation(state) {
      state.singleQuotation = null;
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createQuotationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuotationThunk.fulfilled, (state, action: PayloadAction<Quotation>) => {
        state.loading = false;
        state.quotations = [action.payload, ...state.quotations];
        state.successMessage = "Quotation created successfully";
      })
      .addCase(createQuotationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllQuotationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllQuotationsThunk.fulfilled, (state, action: PayloadAction<{ data: Quotation[]; totalCount: number }>) => {
        state.loading = false;
        state.quotations = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(getAllQuotationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.quotations = [];
      })
      .addCase(getQuotationByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuotationByIdThunk.fulfilled, (state, action: PayloadAction<Quotation>) => {
        state.loading = false;
        state.singleQuotation = action.payload;
      })
      .addCase(getQuotationByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteQuotationThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.quotations = state.quotations.filter((q) => q._id !== action.payload);
        state.successMessage = "Quotation deleted successfully";
      })
      .addCase(deleteQuotationThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(getQuotationHistoryThunk.fulfilled, (state, action: PayloadAction<QuotationHistoryEntry[]>) => {
        state.history = action.payload;
      })
      // The 6 status-transition thunks (submit/approve/reject/send/respond/convert)
      // and updateQuotationThunk all share the same shape: pending -> loading,
      // fulfilled -> replace singleQuotation + toast, rejected -> error.
      .addMatcher(
        isAnyOf(
          updateQuotationThunk.pending,
          submitQuotationForApprovalThunk.pending,
          approveQuotationThunk.pending,
          rejectQuotationThunk.pending,
          sendQuotationThunk.pending,
          respondQuotationThunk.pending,
          convertQuotationThunk.pending
        ),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(
          updateQuotationThunk.fulfilled,
          submitQuotationForApprovalThunk.fulfilled,
          approveQuotationThunk.fulfilled,
          rejectQuotationThunk.fulfilled,
          sendQuotationThunk.fulfilled,
          respondQuotationThunk.fulfilled,
          convertQuotationThunk.fulfilled
        ),
        (state, action: PayloadAction<Quotation>) => {
          state.loading = false;
          state.singleQuotation = action.payload;
          const index = state.quotations.findIndex((q) => q._id === action.payload._id);
          if (index !== -1) state.quotations[index] = action.payload;
          state.successMessage = "Quotation updated successfully";
        }
      )
      .addMatcher(
        isAnyOf(
          updateQuotationThunk.rejected,
          submitQuotationForApprovalThunk.rejected,
          approveQuotationThunk.rejected,
          rejectQuotationThunk.rejected,
          sendQuotationThunk.rejected,
          respondQuotationThunk.rejected,
          convertQuotationThunk.rejected
        ),
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { clearQuotationError, clearQuotationSuccessMessage, clearSingleQuotation } = quotationSlice.actions;
export default quotationSlice.reducer;
