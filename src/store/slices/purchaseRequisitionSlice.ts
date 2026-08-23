import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import {
  purchaseRequisitionService,
  PurchaseRequisition,
  PurchaseRequisitionHistoryEntry,
} from "@/services/purchaseRequisition.service";

interface PurchaseRequisitionState {
  purchaseRequisitions: PurchaseRequisition[];
  singlePurchaseRequisition: PurchaseRequisition | null;
  history: PurchaseRequisitionHistoryEntry[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: PurchaseRequisitionState = {
  purchaseRequisitions: [],
  singlePurchaseRequisition: null,
  history: [],
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

interface CreatePurchaseRequisitionData {
  companyName: string;
  notes?: string;
  items: { materialId: string; quantityRequired: number; notes?: string }[];
}

interface ConvertToPoData {
  vendorId: string;
  expectedDate?: string;
  notes?: string;
  items: { requisitionItemId: string; rate: number }[];
}

export const createPurchaseRequisitionThunk = createAsyncThunk(
  "purchaseRequisition/create",
  async (data: CreatePurchaseRequisitionData, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.createPurchaseRequisition(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create purchase requisition");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create purchase requisition");
    }
  }
);

export const getAllPurchaseRequisitionsThunk = createAsyncThunk(
  "purchaseRequisition/getAll",
  async (params: { status?: string; search?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.getAllPurchaseRequisitions(params);
      if (response.success && Array.isArray(response.data)) {
        return { data: response.data, totalCount: response.pagination?.totalCount ?? response.data.length };
      }
      return rejectWithValue("Invalid response format: Purchase requisitions array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase requisitions");
    }
  }
);

export const getPurchaseRequisitionByIdThunk = createAsyncThunk(
  "purchaseRequisition/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.getPurchaseRequisitionById(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Purchase requisition not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase requisition");
    }
  }
);

export const deletePurchaseRequisitionThunk = createAsyncThunk(
  "purchaseRequisition/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.deletePurchaseRequisition(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete purchase requisition");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase requisition");
    }
  }
);

export const submitPrForApprovalThunk = createAsyncThunk(
  "purchaseRequisition/submitForApproval",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.submitForApproval(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to submit for approval");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit for approval");
    }
  }
);

export const approvePurchaseRequisitionThunk = createAsyncThunk(
  "purchaseRequisition/approve",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.approvePurchaseRequisition(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to approve purchase requisition");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to approve purchase requisition");
    }
  }
);

export const rejectPurchaseRequisitionThunk = createAsyncThunk(
  "purchaseRequisition/reject",
  async ({ id, remarks }: { id: string; remarks: string }, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.rejectPurchaseRequisition(id, remarks);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to reject purchase requisition");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to reject purchase requisition");
    }
  }
);

export const cancelPurchaseRequisitionThunk = createAsyncThunk(
  "purchaseRequisition/cancel",
  async ({ id, remarks }: { id: string; remarks: string }, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.cancelPurchaseRequisition(id, remarks);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to cancel purchase requisition");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to cancel purchase requisition");
    }
  }
);

export const convertPrToRfqThunk = createAsyncThunk(
  "purchaseRequisition/convertToRfq",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.convertToRfq(id);
      if (response.success) return { id, rfqId: response.data?.rfqId };
      return rejectWithValue(response.message || "Failed to convert requisition to RFQ");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to convert requisition to RFQ");
    }
  }
);

export const convertPrToPoThunk = createAsyncThunk(
  "purchaseRequisition/convertToPo",
  async ({ id, data }: { id: string; data: ConvertToPoData }, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.convertToPo(id, data);
      if (response.success) return { id, poId: response.data?.poId };
      return rejectWithValue(response.message || "Failed to convert requisition to purchase order");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to convert requisition to purchase order");
    }
  }
);

export const getPurchaseRequisitionHistoryThunk = createAsyncThunk(
  "purchaseRequisition/getHistory",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await purchaseRequisitionService.getPurchaseRequisitionHistory(id);
      if (response.success) return response.data || [];
      return rejectWithValue(response.message || "Failed to fetch purchase requisition history");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase requisition history");
    }
  }
);

const purchaseRequisitionSlice = createSlice({
  name: "purchaseRequisition",
  initialState,
  reducers: {
    clearPurchaseRequisitionError(state) {
      state.error = null;
    },
    clearPurchaseRequisitionSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSinglePurchaseRequisition(state) {
      state.singlePurchaseRequisition = null;
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPurchaseRequisitionThunk.fulfilled, (state, action: PayloadAction<PurchaseRequisition>) => {
        state.loading = false;
        state.purchaseRequisitions = [action.payload, ...state.purchaseRequisitions];
        state.successMessage = "Purchase requisition created successfully";
      })
      .addCase(getAllPurchaseRequisitionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllPurchaseRequisitionsThunk.fulfilled,
        (state, action: PayloadAction<{ data: PurchaseRequisition[]; totalCount: number }>) => {
          state.loading = false;
          state.purchaseRequisitions = action.payload.data;
          state.totalCount = action.payload.totalCount;
        }
      )
      .addCase(getAllPurchaseRequisitionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.purchaseRequisitions = [];
      })
      .addCase(getPurchaseRequisitionByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPurchaseRequisitionByIdThunk.fulfilled, (state, action: PayloadAction<PurchaseRequisition>) => {
        state.loading = false;
        state.singlePurchaseRequisition = action.payload;
      })
      .addCase(getPurchaseRequisitionByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deletePurchaseRequisitionThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.purchaseRequisitions = state.purchaseRequisitions.filter((p) => p._id !== action.payload);
        state.successMessage = "Purchase requisition deleted successfully";
      })
      .addCase(deletePurchaseRequisitionThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(getPurchaseRequisitionHistoryThunk.fulfilled, (state, action: PayloadAction<PurchaseRequisitionHistoryEntry[]>) => {
        state.history = action.payload;
      })
      .addCase(getPurchaseRequisitionHistoryThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addMatcher(
        isAnyOf(
          createPurchaseRequisitionThunk.pending,
          submitPrForApprovalThunk.pending,
          approvePurchaseRequisitionThunk.pending,
          rejectPurchaseRequisitionThunk.pending,
          cancelPurchaseRequisitionThunk.pending,
          convertPrToRfqThunk.pending,
          convertPrToPoThunk.pending
        ),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(
          submitPrForApprovalThunk.fulfilled,
          approvePurchaseRequisitionThunk.fulfilled,
          rejectPurchaseRequisitionThunk.fulfilled,
          cancelPurchaseRequisitionThunk.fulfilled
        ),
        (state, action: PayloadAction<PurchaseRequisition>) => {
          state.loading = false;
          state.singlePurchaseRequisition = action.payload;
          const index = state.purchaseRequisitions.findIndex((p) => p._id === action.payload._id);
          if (index !== -1) state.purchaseRequisitions[index] = action.payload;
          state.successMessage = "Purchase requisition updated successfully";
        }
      )
      .addMatcher(
        isAnyOf(convertPrToRfqThunk.fulfilled, convertPrToPoThunk.fulfilled),
        (state, action: PayloadAction<{ id: string; rfqId?: string; poId?: string }>) => {
          state.loading = false;
          if (state.singlePurchaseRequisition && state.singlePurchaseRequisition._id === action.payload.id) {
            state.singlePurchaseRequisition.status = "Converted";
            if (action.payload.rfqId) state.singlePurchaseRequisition.convertedToRfqId = action.payload.rfqId;
            if (action.payload.poId) state.singlePurchaseRequisition.convertedToPoId = action.payload.poId;
          }
          state.successMessage = action.payload.poId
            ? "Purchase requisition converted to purchase order"
            : "Purchase requisition converted to RFQ";
        }
      )
      .addMatcher(
        isAnyOf(
          createPurchaseRequisitionThunk.rejected,
          submitPrForApprovalThunk.rejected,
          approvePurchaseRequisitionThunk.rejected,
          rejectPurchaseRequisitionThunk.rejected,
          cancelPurchaseRequisitionThunk.rejected,
          convertPrToRfqThunk.rejected,
          convertPrToPoThunk.rejected
        ),
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const {
  clearPurchaseRequisitionError,
  clearPurchaseRequisitionSuccessMessage,
  clearSinglePurchaseRequisition,
} = purchaseRequisitionSlice.actions;
export default purchaseRequisitionSlice.reducer;
