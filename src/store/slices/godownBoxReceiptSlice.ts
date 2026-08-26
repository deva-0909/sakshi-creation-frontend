import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { godownBoxReceiptService, GodownBoxReceipt, CreateGodownBoxReceiptData } from "@/services/godownBoxReceipt.service";

interface GodownBoxReceiptState {
  receipts: GodownBoxReceipt[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: GodownBoxReceiptState = {
  receipts: [],
  loading: false,
  error: null,
  successMessage: null,
};

export const getAllGodownBoxReceiptsThunk = createAsyncThunk(
  "godownBoxReceipts/getAll",
  async (params: { type?: "inward" | "outward"; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await godownBoxReceiptService.getAllGodownBoxReceipts(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch box/cartoon receipts");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch box/cartoon receipts");
    }
  }
);

export const createGodownBoxReceiptThunk = createAsyncThunk(
  "godownBoxReceipts/create",
  async (data: CreateGodownBoxReceiptData, { rejectWithValue }) => {
    try {
      const response = await godownBoxReceiptService.createGodownBoxReceipt(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create box/cartoon receipt");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create box/cartoon receipt");
    }
  }
);

export const updateGodownBoxReceiptThunk = createAsyncThunk(
  "godownBoxReceipts/update",
  async ({ id, data }: { id: string; data: Partial<CreateGodownBoxReceiptData> }, { rejectWithValue }) => {
    try {
      const response = await godownBoxReceiptService.updateGodownBoxReceipt(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update box/cartoon receipt");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update box/cartoon receipt");
    }
  }
);

export const deleteGodownBoxReceiptThunk = createAsyncThunk(
  "godownBoxReceipts/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await godownBoxReceiptService.deleteGodownBoxReceipt(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete box/cartoon receipt");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete box/cartoon receipt");
    }
  }
);

const godownBoxReceiptSlice = createSlice({
  name: "godownBoxReceipts",
  initialState,
  reducers: {
    clearGodownBoxReceiptError(state) {
      state.error = null;
    },
    clearGodownBoxReceiptSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllGodownBoxReceiptsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllGodownBoxReceiptsThunk.fulfilled, (state, action: PayloadAction<GodownBoxReceipt[]>) => {
        state.loading = false;
        state.receipts = action.payload;
      })
      .addCase(getAllGodownBoxReceiptsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.receipts = [];
      })
      .addCase(createGodownBoxReceiptThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGodownBoxReceiptThunk.fulfilled, (state, action: PayloadAction<GodownBoxReceipt>) => {
        state.loading = false;
        state.receipts = [...state.receipts, action.payload];
        state.successMessage = "Box/Cartoon receipt created successfully";
      })
      .addCase(createGodownBoxReceiptThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateGodownBoxReceiptThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGodownBoxReceiptThunk.fulfilled, (state, action: PayloadAction<GodownBoxReceipt>) => {
        state.loading = false;
        state.receipts = state.receipts.map((r) => (r._id === action.payload._id ? action.payload : r));
        state.successMessage = "Box/Cartoon receipt updated successfully";
      })
      .addCase(updateGodownBoxReceiptThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteGodownBoxReceiptThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGodownBoxReceiptThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.receipts = state.receipts.filter((r) => r._id !== action.payload);
        state.successMessage = "Box/Cartoon receipt deleted successfully";
      })
      .addCase(deleteGodownBoxReceiptThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearGodownBoxReceiptError, clearGodownBoxReceiptSuccessMessage } = godownBoxReceiptSlice.actions;
export default godownBoxReceiptSlice.reducer;
