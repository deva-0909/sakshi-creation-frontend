import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { receiptService, Receipt } from "@/services/receipt.service";

interface ReceiptState {
  receipts: Receipt[];
  singleReceipt: Receipt | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ReceiptState = {
  receipts: [],
  singleReceipt: null,
  loading: false,
  error: null,
  successMessage: null,
};

interface CreateReceiptData {
  invoiceId?: string;
  partyId: string;
  companyName: string;
  amount: number;
  paymentDate: string;
  mode: string;
  referenceNumber?: string;
  notes?: string;
}

export const createReceiptThunk = createAsyncThunk("receipt/create", async (data: CreateReceiptData, { rejectWithValue }) => {
  try {
    const response = await receiptService.createReceipt(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to record receipt");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to record receipt");
  }
});

export const getAllReceiptsThunk = createAsyncThunk(
  "receipt/getAll",
  async (params: { invoiceId?: string; partyId?: string; search?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await receiptService.getAllReceipts(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue("Invalid response format: receipts array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch receipts");
    }
  }
);

export const getReceiptByIdThunk = createAsyncThunk("receipt/getById", async (id: string, { rejectWithValue }) => {
  try {
    const response = await receiptService.getReceiptById(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Receipt not found");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch receipt");
  }
});

const receiptSlice = createSlice({
  name: "receipt",
  initialState,
  reducers: {
    clearReceiptError(state) {
      state.error = null;
    },
    clearReceiptSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleReceipt(state) {
      state.singleReceipt = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReceiptThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReceiptThunk.fulfilled, (state, action: PayloadAction<Receipt>) => {
        state.loading = false;
        state.receipts = [action.payload, ...state.receipts];
        state.successMessage = "Receipt recorded successfully";
      })
      .addCase(createReceiptThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllReceiptsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllReceiptsThunk.fulfilled, (state, action: PayloadAction<Receipt[]>) => {
        state.loading = false;
        state.receipts = action.payload;
      })
      .addCase(getAllReceiptsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.receipts = [];
      })
      .addCase(getReceiptByIdThunk.fulfilled, (state, action: PayloadAction<Receipt>) => {
        state.singleReceipt = action.payload;
      })
      .addCase(getReceiptByIdThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearReceiptError, clearReceiptSuccessMessage, clearSingleReceipt } = receiptSlice.actions;
export default receiptSlice.reducer;
