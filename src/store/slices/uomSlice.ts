import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { uomService, Uom, CreateUomData } from "@/services/uom.service";

interface UomState {
  uoms: Uom[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: UomState = { uoms: [], loading: false, error: null, successMessage: null };

export const getAllUomsThunk = createAsyncThunk("uoms/getAll", async (params: { status?: string; search?: string } | undefined, { rejectWithValue }) => {
  try {
    const response = await uomService.getAllUoms(params);
    if (response.success && Array.isArray(response.data)) return response.data;
    return rejectWithValue(response.message || "Failed to fetch units of measure");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch units of measure");
  }
});

export const createUomThunk = createAsyncThunk("uoms/create", async (data: CreateUomData, { rejectWithValue }) => {
  try {
    const response = await uomService.createUom(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create unit of measure");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create unit of measure");
  }
});

export const updateUomThunk = createAsyncThunk("uoms/update", async ({ id, data }: { id: string; data: Partial<CreateUomData> }, { rejectWithValue }) => {
  try {
    const response = await uomService.updateUom(id, data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to update unit of measure");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update unit of measure");
  }
});

export const deleteUomThunk = createAsyncThunk("uoms/delete", async (id: string, { rejectWithValue }) => {
  try {
    const response = await uomService.deleteUom(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete unit of measure");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete unit of measure");
  }
});

const uomSlice = createSlice({
  name: "uoms",
  initialState,
  reducers: {
    clearUomError(state) {
      state.error = null;
    },
    clearUomSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllUomsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllUomsThunk.fulfilled, (state, action: PayloadAction<Uom[]>) => {
        state.loading = false;
        state.uoms = action.payload;
      })
      .addCase(getAllUomsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.uoms = [];
      })
      .addCase(createUomThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUomThunk.fulfilled, (state, action: PayloadAction<Uom>) => {
        state.loading = false;
        state.uoms = [...state.uoms, action.payload];
        state.successMessage = "Unit of measure created successfully";
      })
      .addCase(createUomThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateUomThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUomThunk.fulfilled, (state, action: PayloadAction<Uom>) => {
        state.loading = false;
        state.uoms = state.uoms.map((u) => (u._id === action.payload._id ? action.payload : u));
        state.successMessage = "Unit of measure updated successfully";
      })
      .addCase(updateUomThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteUomThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUomThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.uoms = state.uoms.filter((u) => u._id !== action.payload);
        state.successMessage = "Unit of measure deleted successfully";
      })
      .addCase(deleteUomThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUomError, clearUomSuccessMessage } = uomSlice.actions;
export default uomSlice.reducer;
