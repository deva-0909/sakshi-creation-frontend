import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import { invoiceService, Invoice, InvoiceHistoryEntry } from "@/services/invoice.service";

interface InvoiceState {
  invoices: Invoice[];
  singleInvoice: Invoice | null;
  history: InvoiceHistoryEntry[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: InvoiceState = {
  invoices: [],
  singleInvoice: null,
  history: [],
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

interface CreateInvoiceData {
  companyName: string;
  partyId: string;
  orderId?: string;
  quotationId?: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  items: { description: string; hsnCode?: string; quantity: number; unitPrice: number; gstRate: number }[];
}

export const createInvoiceThunk = createAsyncThunk("invoice/create", async (data: CreateInvoiceData, { rejectWithValue }) => {
  try {
    const response = await invoiceService.createInvoice(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create invoice");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create invoice");
  }
});

export const getAllInvoicesThunk = createAsyncThunk(
  "invoice/getAll",
  async (params: { status?: string; partyId?: string; companyName?: string; search?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await invoiceService.getAllInvoices(params);
      if (response.success && Array.isArray(response.data)) {
        return { data: response.data, totalCount: response.pagination?.totalCount ?? response.data.length };
      }
      return rejectWithValue("Invalid response format: invoices array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch invoices");
    }
  }
);

export const getInvoiceByIdThunk = createAsyncThunk("invoice/getById", async (id: string, { rejectWithValue }) => {
  try {
    const response = await invoiceService.getInvoiceById(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Invoice not found");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch invoice");
  }
});

export const deleteInvoiceThunk = createAsyncThunk("invoice/delete", async (id: string, { rejectWithValue }) => {
  try {
    const response = await invoiceService.deleteInvoice(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete invoice");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete invoice");
  }
});

export const issueInvoiceThunk = createAsyncThunk("invoice/issue", async (id: string, { rejectWithValue }) => {
  try {
    const response = await invoiceService.issueInvoice(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to issue invoice");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to issue invoice");
  }
});

export const cancelInvoiceThunk = createAsyncThunk(
  "invoice/cancel",
  async ({ id, remarks }: { id: string; remarks: string }, { rejectWithValue }) => {
    try {
      const response = await invoiceService.cancelInvoice(id, remarks);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to cancel invoice");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to cancel invoice");
    }
  }
);

export const getInvoiceHistoryThunk = createAsyncThunk("invoice/getHistory", async (id: string, { rejectWithValue }) => {
  try {
    const response = await invoiceService.getInvoiceHistory(id);
    if (response.success) return response.data || [];
    return rejectWithValue(response.message || "Failed to fetch invoice history");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch invoice history");
  }
});

const invoiceSlice = createSlice({
  name: "invoice",
  initialState,
  reducers: {
    clearInvoiceError(state) {
      state.error = null;
    },
    clearInvoiceSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleInvoice(state) {
      state.singleInvoice = null;
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createInvoiceThunk.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.loading = false;
        state.invoices = [action.payload, ...state.invoices];
        state.successMessage = "Invoice created successfully";
      })
      .addCase(getAllInvoicesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllInvoicesThunk.fulfilled, (state, action: PayloadAction<{ data: Invoice[]; totalCount: number }>) => {
        state.loading = false;
        state.invoices = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(getAllInvoicesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.invoices = [];
      })
      .addCase(getInvoiceByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getInvoiceByIdThunk.fulfilled, (state, action: PayloadAction<Invoice>) => {
        state.loading = false;
        state.singleInvoice = action.payload;
      })
      .addCase(getInvoiceByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteInvoiceThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.invoices = state.invoices.filter((i) => i._id !== action.payload);
        state.successMessage = "Invoice deleted successfully";
      })
      .addCase(deleteInvoiceThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(getInvoiceHistoryThunk.fulfilled, (state, action: PayloadAction<InvoiceHistoryEntry[]>) => {
        state.history = action.payload;
      })
      .addCase(getInvoiceHistoryThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addMatcher(isAnyOf(createInvoiceThunk.pending, issueInvoiceThunk.pending, cancelInvoiceThunk.pending), (state) => {
        state.loading = true;
        state.error = null;
      })
      .addMatcher(isAnyOf(issueInvoiceThunk.fulfilled, cancelInvoiceThunk.fulfilled), (state, action: PayloadAction<Invoice>) => {
        state.loading = false;
        state.singleInvoice = action.payload;
        const index = state.invoices.findIndex((i) => i._id === action.payload._id);
        if (index !== -1) state.invoices[index] = action.payload;
        state.successMessage = "Invoice updated successfully";
      })
      .addMatcher(isAnyOf(createInvoiceThunk.rejected, issueInvoiceThunk.rejected, cancelInvoiceThunk.rejected), (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearInvoiceError, clearInvoiceSuccessMessage, clearSingleInvoice } = invoiceSlice.actions;
export default invoiceSlice.reducer;
