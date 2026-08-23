import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { purchaseReturnService, PurchaseReturn, CreatePurchaseReturnData } from "@/services/purchaseReturn.service";

interface PurchaseReturnState {
  purchaseReturns: PurchaseReturn[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: PurchaseReturnState = {
  purchaseReturns: [],
  loading: false,
  error: null,
  successMessage: null,
};

export const createPurchaseReturnThunk = createAsyncThunk(
  "purchaseReturn/create",
  async (data: CreatePurchaseReturnData, { rejectWithValue }) => {
    try {
      const response = await purchaseReturnService.createPurchaseReturn(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to post purchase return");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to post purchase return");
    }
  }
);

export const getAllPurchaseReturnsThunk = createAsyncThunk(
  "purchaseReturn/getAll",
  async (params: { grnId?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await purchaseReturnService.getAllPurchaseReturns(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch purchase returns");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase returns");
    }
  }
);

const purchaseReturnSlice = createSlice({
  name: "purchaseReturn",
  initialState,
  reducers: {
    clearPurchaseReturnError(state) {
      state.error = null;
    },
    clearPurchaseReturnSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPurchaseReturnThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPurchaseReturnThunk.fulfilled, (state, action: PayloadAction<PurchaseReturn>) => {
        state.loading = false;
        state.purchaseReturns = [action.payload, ...state.purchaseReturns];
        state.successMessage = "Purchase return posted successfully";
      })
      .addCase(createPurchaseReturnThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllPurchaseReturnsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllPurchaseReturnsThunk.fulfilled, (state, action: PayloadAction<PurchaseReturn[]>) => {
        state.loading = false;
        state.purchaseReturns = action.payload;
      })
      .addCase(getAllPurchaseReturnsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.purchaseReturns = [];
      });
  },
});

export const { clearPurchaseReturnError, clearPurchaseReturnSuccessMessage } = purchaseReturnSlice.actions;
export default purchaseReturnSlice.reducer;
