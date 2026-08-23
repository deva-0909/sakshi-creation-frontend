import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  stockMovementService,
  StockTransfer,
  CreateStockTransferData,
  StockAdjustment,
  CreateStockAdjustmentData,
  StockReservation,
  CreateStockReservationData,
} from "@/services/stockMovement.service";

interface StockMovementState {
  transfers: StockTransfer[];
  adjustments: StockAdjustment[];
  reservations: StockReservation[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: StockMovementState = {
  transfers: [],
  adjustments: [],
  reservations: [],
  loading: false,
  error: null,
  successMessage: null,
};

export const getAllStockTransfersThunk = createAsyncThunk(
  "stockMovements/getAllTransfers",
  async (params: { materialId?: string; warehouse?: string; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await stockMovementService.getAllTransfers(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch stock transfers");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch stock transfers");
    }
  }
);

export const createStockTransferThunk = createAsyncThunk("stockMovements/createTransfer", async (data: CreateStockTransferData, { rejectWithValue }) => {
  try {
    const response = await stockMovementService.createTransfer(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to record stock transfer");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to record stock transfer");
  }
});

export const getAllStockAdjustmentsThunk = createAsyncThunk(
  "stockMovements/getAllAdjustments",
  async (params: { materialId?: string; warehouse?: string; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await stockMovementService.getAllAdjustments(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch stock adjustments");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch stock adjustments");
    }
  }
);

export const createStockAdjustmentThunk = createAsyncThunk("stockMovements/createAdjustment", async (data: CreateStockAdjustmentData, { rejectWithValue }) => {
  try {
    const response = await stockMovementService.createAdjustment(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to record stock adjustment");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to record stock adjustment");
  }
});

export const getAllStockReservationsThunk = createAsyncThunk(
  "stockMovements/getAllReservations",
  async (params: { materialId?: string; warehouse?: string; status?: string; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await stockMovementService.getAllReservations(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch stock reservations");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch stock reservations");
    }
  }
);

export const createStockReservationThunk = createAsyncThunk("stockMovements/createReservation", async (data: CreateStockReservationData, { rejectWithValue }) => {
  try {
    const response = await stockMovementService.createReservation(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create stock reservation");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create stock reservation");
  }
});

export const updateReservationStatusThunk = createAsyncThunk(
  "stockMovements/updateReservationStatus",
  async ({ id, status }: { id: string; status: "Consumed" | "Cancelled" }, { rejectWithValue }) => {
    try {
      const response = await stockMovementService.updateReservationStatus(id, status);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update reservation status");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update reservation status");
    }
  }
);

export const deleteReservationThunk = createAsyncThunk("stockMovements/deleteReservation", async (id: string, { rejectWithValue }) => {
  try {
    const response = await stockMovementService.deleteReservation(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete reservation");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete reservation");
  }
});

const stockMovementSlice = createSlice({
  name: "stockMovements",
  initialState,
  reducers: {
    clearStockMovementError(state) {
      state.error = null;
    },
    clearStockMovementSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Transfers
      .addCase(getAllStockTransfersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllStockTransfersThunk.fulfilled, (state, action: PayloadAction<StockTransfer[]>) => {
        state.loading = false;
        state.transfers = action.payload;
      })
      .addCase(getAllStockTransfersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.transfers = [];
      })
      .addCase(createStockTransferThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStockTransferThunk.fulfilled, (state, action: PayloadAction<StockTransfer>) => {
        state.loading = false;
        state.transfers = [action.payload, ...state.transfers];
        state.successMessage = "Stock transfer recorded successfully";
      })
      .addCase(createStockTransferThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Adjustments
      .addCase(getAllStockAdjustmentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllStockAdjustmentsThunk.fulfilled, (state, action: PayloadAction<StockAdjustment[]>) => {
        state.loading = false;
        state.adjustments = action.payload;
      })
      .addCase(getAllStockAdjustmentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.adjustments = [];
      })
      .addCase(createStockAdjustmentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStockAdjustmentThunk.fulfilled, (state, action: PayloadAction<StockAdjustment>) => {
        state.loading = false;
        state.adjustments = [action.payload, ...state.adjustments];
        state.successMessage = "Stock adjustment recorded successfully";
      })
      .addCase(createStockAdjustmentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Reservations
      .addCase(getAllStockReservationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllStockReservationsThunk.fulfilled, (state, action: PayloadAction<StockReservation[]>) => {
        state.loading = false;
        state.reservations = action.payload;
      })
      .addCase(getAllStockReservationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.reservations = [];
      })
      .addCase(createStockReservationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createStockReservationThunk.fulfilled, (state, action: PayloadAction<StockReservation>) => {
        state.loading = false;
        state.reservations = [action.payload, ...state.reservations];
        state.successMessage = "Stock reservation created successfully";
      })
      .addCase(createStockReservationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateReservationStatusThunk.fulfilled, (state, action: PayloadAction<StockReservation>) => {
        state.reservations = state.reservations.map((r) => (r._id === action.payload._id ? action.payload : r));
        state.successMessage = "Reservation updated successfully";
      })
      .addCase(updateReservationStatusThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteReservationThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.reservations = state.reservations.filter((r) => r._id !== action.payload);
        state.successMessage = "Reservation deleted successfully";
      })
      .addCase(deleteReservationThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearStockMovementError, clearStockMovementSuccessMessage } = stockMovementSlice.actions;
export default stockMovementSlice.reducer;
