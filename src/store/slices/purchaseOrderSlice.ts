import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import { purchaseOrderService, PurchaseOrder, PurchaseOrderHistoryEntry } from "@/services/purchaseOrder.service";

interface PurchaseOrderState {
  purchaseOrders: PurchaseOrder[];
  singlePurchaseOrder: PurchaseOrder | null;
  history: PurchaseOrderHistoryEntry[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: PurchaseOrderState = {
  purchaseOrders: [],
  singlePurchaseOrder: null,
  history: [],
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

interface CreatePurchaseOrderData {
  vendorId: string;
  companyName: string;
  expectedDate?: string;
  notes?: string;
  items: { materialId: string; quantityOrdered: number; rate: number }[];
}

export const createPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/create",
  async (data: CreatePurchaseOrderData, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.createPurchaseOrder(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create purchase order");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create purchase order");
    }
  }
);

export const selectWinningQuoteThunk = createAsyncThunk(
  "purchaseOrder/selectWinningQuote",
  async ({ quoteId, expectedDate, notes }: { quoteId: string; expectedDate?: string; notes?: string }, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.selectWinningQuote(quoteId, expectedDate, notes);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to select winning quote");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to select winning quote");
    }
  }
);

export const getAllPurchaseOrdersThunk = createAsyncThunk(
  "purchaseOrder/getAll",
  async (params: { status?: string; vendorId?: string; search?: string; page?: number; limit?: number; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.getAllPurchaseOrders(params);
      if (response.success && Array.isArray(response.data)) {
        return { data: response.data, totalCount: response.pagination?.totalCount ?? response.data.length };
      }
      return rejectWithValue("Invalid response format: Purchase orders array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase orders");
    }
  }
);

export const getPurchaseOrderByIdThunk = createAsyncThunk("purchaseOrder/getById", async (id: string, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderService.getPurchaseOrderById(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Purchase order not found");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch purchase order");
  }
});

export const deletePurchaseOrderThunk = createAsyncThunk("purchaseOrder/delete", async (id: string, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderService.deletePurchaseOrder(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete purchase order");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete purchase order");
  }
});

export const submitForApprovalThunk = createAsyncThunk("purchaseOrder/submitForApproval", async (id: string, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderService.submitForApproval(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to submit for approval");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to submit for approval");
  }
});

export const approvePurchaseOrderThunk = createAsyncThunk("purchaseOrder/approve", async (id: string, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderService.approvePurchaseOrder(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to approve purchase order");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to approve purchase order");
  }
});

export const rejectPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/reject",
  async ({ id, remarks }: { id: string; remarks: string }, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.rejectPurchaseOrder(id, remarks);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to reject purchase order");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to reject purchase order");
    }
  }
);

export const sendPurchaseOrderThunk = createAsyncThunk("purchaseOrder/send", async (id: string, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderService.sendPurchaseOrder(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to send purchase order");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to send purchase order");
  }
});

export const cancelPurchaseOrderThunk = createAsyncThunk(
  "purchaseOrder/cancel",
  async ({ id, remarks }: { id: string; remarks: string }, { rejectWithValue }) => {
    try {
      const response = await purchaseOrderService.cancelPurchaseOrder(id, remarks);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to cancel purchase order");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to cancel purchase order");
    }
  }
);

export const acknowledgePurchaseOrderThunk = createAsyncThunk("purchaseOrder/acknowledge", async (id: string, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderService.acknowledgePurchaseOrder(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to acknowledge purchase order");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to acknowledge purchase order");
  }
});

export const getPurchaseOrderHistoryThunk = createAsyncThunk("purchaseOrder/getHistory", async (id: string, { rejectWithValue }) => {
  try {
    const response = await purchaseOrderService.getPurchaseOrderHistory(id);
    if (response.success) return response.data || [];
    return rejectWithValue(response.message || "Failed to fetch purchase order history");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch purchase order history");
  }
});

const purchaseOrderSlice = createSlice({
  name: "purchaseOrder",
  initialState,
  reducers: {
    clearPurchaseOrderError(state) {
      state.error = null;
    },
    clearPurchaseOrderSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSinglePurchaseOrder(state) {
      state.singlePurchaseOrder = null;
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPurchaseOrderThunk.fulfilled, (state, action: PayloadAction<PurchaseOrder>) => {
        state.loading = false;
        state.purchaseOrders = [action.payload, ...state.purchaseOrders];
        state.successMessage = "Purchase order created successfully";
      })
      .addCase(selectWinningQuoteThunk.fulfilled, (state, action: PayloadAction<PurchaseOrder>) => {
        state.loading = false;
        state.purchaseOrders = [action.payload, ...state.purchaseOrders];
        state.successMessage = "Purchase order created from winning quote";
      })
      .addCase(getAllPurchaseOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPurchaseOrdersThunk.fulfilled, (state, action: PayloadAction<{ data: PurchaseOrder[]; totalCount: number }>) => {
        state.loading = false;
        state.purchaseOrders = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(getAllPurchaseOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.purchaseOrders = [];
      })
      .addCase(getPurchaseOrderByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPurchaseOrderByIdThunk.fulfilled, (state, action: PayloadAction<PurchaseOrder>) => {
        state.loading = false;
        state.singlePurchaseOrder = action.payload;
      })
      .addCase(getPurchaseOrderByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deletePurchaseOrderThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.purchaseOrders = state.purchaseOrders.filter((p) => p._id !== action.payload);
        state.successMessage = "Purchase order deleted successfully";
      })
      .addCase(deletePurchaseOrderThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(getPurchaseOrderHistoryThunk.fulfilled, (state, action: PayloadAction<PurchaseOrderHistoryEntry[]>) => {
        state.history = action.payload;
      })
      .addCase(getPurchaseOrderHistoryThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addMatcher(
        isAnyOf(
          createPurchaseOrderThunk.pending,
          selectWinningQuoteThunk.pending,
          submitForApprovalThunk.pending,
          approvePurchaseOrderThunk.pending,
          rejectPurchaseOrderThunk.pending,
          sendPurchaseOrderThunk.pending,
          cancelPurchaseOrderThunk.pending,
          acknowledgePurchaseOrderThunk.pending
        ),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(
          submitForApprovalThunk.fulfilled,
          approvePurchaseOrderThunk.fulfilled,
          rejectPurchaseOrderThunk.fulfilled,
          sendPurchaseOrderThunk.fulfilled,
          cancelPurchaseOrderThunk.fulfilled,
          acknowledgePurchaseOrderThunk.fulfilled
        ),
        (state, action: PayloadAction<PurchaseOrder>) => {
          state.loading = false;
          state.singlePurchaseOrder = action.payload;
          const index = state.purchaseOrders.findIndex((p) => p._id === action.payload._id);
          if (index !== -1) state.purchaseOrders[index] = action.payload;
          state.successMessage = "Purchase order updated successfully";
        }
      )
      .addMatcher(
        isAnyOf(
          createPurchaseOrderThunk.rejected,
          selectWinningQuoteThunk.rejected,
          submitForApprovalThunk.rejected,
          approvePurchaseOrderThunk.rejected,
          rejectPurchaseOrderThunk.rejected,
          sendPurchaseOrderThunk.rejected,
          cancelPurchaseOrderThunk.rejected,
          acknowledgePurchaseOrderThunk.rejected
        ),
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { clearPurchaseOrderError, clearPurchaseOrderSuccessMessage, clearSinglePurchaseOrder } = purchaseOrderSlice.actions;
export default purchaseOrderSlice.reducer;
