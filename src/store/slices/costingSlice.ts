import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { costingService, Costing } from "@/services/costing.service";

interface CostingState {
  costingList: Costing[];
  singleCosting: Costing | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: CostingState = {
  costingList: [],
  singleCosting: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

export const getAllCostingThunk = createAsyncThunk(
  "costing/getAll",
  async (params: { status?: string; search?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await costingService.getAllCosting(params);
      if (response.success && Array.isArray(response.data)) {
        return { data: response.data, totalCount: response.pagination?.totalCount ?? response.data.length };
      }
      return rejectWithValue("Invalid response format: costing array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch costing summary");
    }
  }
);

export const getCostingByJobCardThunk = createAsyncThunk(
  "costing/getByJobCard",
  async (jobCardId: string, { rejectWithValue }) => {
    try {
      const response = await costingService.getCostingByJobCard(jobCardId);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Job card costing not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch job card costing");
    }
  }
);

export const upsertLaborCostThunk = createAsyncThunk(
  "costing/upsertLabor",
  async (
    {
      jobCardId,
      data,
    }: {
      jobCardId: string;
      data: { laborCost?: number; overheadCost?: number; printingCost?: number; bindingCost?: number; finishingCost?: number; outsourcingCost?: number; deliveryCost?: number; notes?: string };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await costingService.upsertLaborCost(jobCardId, data);
      if (response.success) return jobCardId;
      return rejectWithValue(response.message || "Failed to save labor/overhead cost");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save labor/overhead cost");
    }
  }
);

const costingSlice = createSlice({
  name: "costing",
  initialState,
  reducers: {
    clearCostingError(state) {
      state.error = null;
    },
    clearCostingSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleCosting(state) {
      state.singleCosting = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllCostingThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCostingThunk.fulfilled, (state, action: PayloadAction<{ data: Costing[]; totalCount: number }>) => {
        state.loading = false;
        state.costingList = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(getAllCostingThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.costingList = [];
      })
      .addCase(getCostingByJobCardThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCostingByJobCardThunk.fulfilled, (state, action: PayloadAction<Costing>) => {
        state.loading = false;
        state.singleCosting = action.payload;
      })
      .addCase(getCostingByJobCardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(upsertLaborCostThunk.fulfilled, (state) => {
        state.successMessage = "Labor/overhead cost saved";
      })
      .addCase(upsertLaborCostThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearCostingError, clearCostingSuccessMessage, clearSingleCosting } = costingSlice.actions;
export default costingSlice.reducer;
