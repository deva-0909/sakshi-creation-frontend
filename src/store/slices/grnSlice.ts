import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { grnService, Grn } from "@/services/grn.service";

interface GrnState {
  grns: Grn[];
  singleGrn: Grn | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: GrnState = {
  grns: [],
  singleGrn: null,
  loading: false,
  error: null,
  successMessage: null,
};

interface CreateGrnData {
  purchaseOrderId: string;
  receivedDate: string;
  forRole: string;
  forCompany: string;
  notes?: string;
  items: { purchaseOrderItemId: string; materialId: string; quantityReceived: number; rate: number }[];
}

export const createGrnThunk = createAsyncThunk("grn/create", async (data: CreateGrnData, { rejectWithValue }) => {
  try {
    const response = await grnService.createGrn(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to post GRN");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to post GRN");
  }
});

export const getAllGrnsThunk = createAsyncThunk(
  "grn/getAll",
  async (params: { purchaseOrderId?: string; search?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await grnService.getAllGrns(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue("Invalid response format: GRNs array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch GRNs");
    }
  }
);

export const getGrnByIdThunk = createAsyncThunk("grn/getById", async (id: string, { rejectWithValue }) => {
  try {
    const response = await grnService.getGrnById(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "GRN not found");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch GRN");
  }
});

const grnSlice = createSlice({
  name: "grn",
  initialState,
  reducers: {
    clearGrnError(state) {
      state.error = null;
    },
    clearGrnSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleGrn(state) {
      state.singleGrn = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createGrnThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGrnThunk.fulfilled, (state, action: PayloadAction<Grn>) => {
        state.loading = false;
        state.grns = [action.payload, ...state.grns];
        state.successMessage = "GRN posted successfully";
      })
      .addCase(createGrnThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllGrnsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllGrnsThunk.fulfilled, (state, action: PayloadAction<Grn[]>) => {
        state.loading = false;
        state.grns = action.payload;
      })
      .addCase(getAllGrnsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.grns = [];
      })
      .addCase(getGrnByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getGrnByIdThunk.fulfilled, (state, action: PayloadAction<Grn>) => {
        state.loading = false;
        state.singleGrn = action.payload;
      })
      .addCase(getGrnByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearGrnError, clearGrnSuccessMessage, clearSingleGrn } = grnSlice.actions;
export default grnSlice.reducer;
