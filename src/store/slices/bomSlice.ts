import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { bomService, BomLine, CostEstimate } from "@/services/bom.service";

interface BomState {
  bomLines: BomLine[];
  costEstimate: CostEstimate | null;
  loading: boolean;
  estimateLoading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: BomState = {
  bomLines: [],
  costEstimate: null,
  loading: false,
  estimateLoading: false,
  error: null,
  successMessage: null,
};

interface CreateBomLineData {
  productItem: string;
  material: string;
  quantityPerUnit: number;
  unit?: string;
  notes?: string;
  expectedWastagePercent?: number;
}

export const createBomLineThunk = createAsyncThunk(
  "bom/create",
  async (data: CreateBomLineData, { rejectWithValue }) => {
    try {
      const response = await bomService.createBomLine(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to add recipe line");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add recipe line");
    }
  }
);

export const getBomForProductThunk = createAsyncThunk(
  "bom/getForProduct",
  async (productItemId: string, { rejectWithValue }) => {
    try {
      const response = await bomService.getBomForProduct(productItemId);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch recipe");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch recipe");
    }
  }
);

export const updateBomLineThunk = createAsyncThunk(
  "bom/update",
  async ({ id, data }: { id: string; data: Partial<CreateBomLineData> }, { rejectWithValue }) => {
    try {
      const response = await bomService.updateBomLine(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update recipe line");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update recipe line");
    }
  }
);

export const deleteBomLineThunk = createAsyncThunk(
  "bom/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await bomService.deleteBomLine(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to remove recipe line");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to remove recipe line");
    }
  }
);

export const estimateBomCostThunk = createAsyncThunk(
  "bom/estimateCost",
  async ({ productItemId, qty }: { productItemId: string; qty: number }, { rejectWithValue }) => {
    try {
      const response = await bomService.estimateCost(productItemId, qty);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to estimate cost");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to estimate cost");
    }
  }
);

const bomSlice = createSlice({
  name: "bom",
  initialState,
  reducers: {
    clearBomError(state) {
      state.error = null;
    },
    clearBomSuccessMessage(state) {
      state.successMessage = null;
    },
    clearBomLines(state) {
      state.bomLines = [];
    },
    clearCostEstimate(state) {
      state.costEstimate = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBomLineThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBomLineThunk.fulfilled, (state, action: PayloadAction<BomLine>) => {
        state.loading = false;
        state.bomLines = [...state.bomLines, action.payload];
        state.successMessage = "Recipe line added";
      })
      .addCase(createBomLineThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getBomForProductThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBomForProductThunk.fulfilled, (state, action: PayloadAction<BomLine[]>) => {
        state.loading = false;
        state.bomLines = action.payload;
      })
      .addCase(getBomForProductThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.bomLines = [];
      })
      .addCase(updateBomLineThunk.fulfilled, (state, action: PayloadAction<BomLine>) => {
        const index = state.bomLines.findIndex((l) => l._id === action.payload._id);
        if (index !== -1) state.bomLines[index] = action.payload;
        state.successMessage = "Recipe line updated";
      })
      .addCase(updateBomLineThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteBomLineThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.bomLines = state.bomLines.filter((l) => l._id !== action.payload);
        state.successMessage = "Recipe line removed";
      })
      .addCase(deleteBomLineThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(estimateBomCostThunk.pending, (state) => {
        state.estimateLoading = true;
      })
      .addCase(estimateBomCostThunk.fulfilled, (state, action: PayloadAction<CostEstimate>) => {
        state.estimateLoading = false;
        state.costEstimate = action.payload;
      })
      .addCase(estimateBomCostThunk.rejected, (state, action) => {
        state.estimateLoading = false;
        state.error = action.payload as string;
        state.costEstimate = null;
      });
  },
});

export const { clearBomError, clearBomSuccessMessage, clearBomLines, clearCostEstimate } = bomSlice.actions;
export default bomSlice.reducer;
