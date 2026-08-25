import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { dyePunchService, DyePunch, CreateDyePunchData } from "@/services/dyePunch.service";

interface DyePunchState {
  dyePunches: DyePunch[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: DyePunchState = {
  dyePunches: [],
  loading: false,
  error: null,
  successMessage: null,
};

export const getAllDyePunchesThunk = createAsyncThunk(
  "dyePunches/getAll",
  async (params: { companyName?: string; search?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await dyePunchService.getAllDyePunches(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch dye/punches");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch dye/punches");
    }
  }
);

export const createDyePunchThunk = createAsyncThunk(
  "dyePunches/create",
  async (data: CreateDyePunchData, { rejectWithValue }) => {
    try {
      const response = await dyePunchService.createDyePunch(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create dye/punch");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create dye/punch");
    }
  }
);

export const updateDyePunchThunk = createAsyncThunk(
  "dyePunches/update",
  async ({ id, data }: { id: string; data: Partial<CreateDyePunchData> }, { rejectWithValue }) => {
    try {
      const response = await dyePunchService.updateDyePunch(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update dye/punch");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update dye/punch");
    }
  }
);

export const deleteDyePunchThunk = createAsyncThunk(
  "dyePunches/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await dyePunchService.deleteDyePunch(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete dye/punch");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete dye/punch");
    }
  }
);

const dyePunchSlice = createSlice({
  name: "dyePunches",
  initialState,
  reducers: {
    clearDyePunchError(state) {
      state.error = null;
    },
    clearDyePunchSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllDyePunchesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllDyePunchesThunk.fulfilled, (state, action: PayloadAction<DyePunch[]>) => {
        state.loading = false;
        state.dyePunches = action.payload;
      })
      .addCase(getAllDyePunchesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.dyePunches = [];
      })
      .addCase(createDyePunchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDyePunchThunk.fulfilled, (state, action: PayloadAction<DyePunch>) => {
        state.loading = false;
        state.dyePunches = [...state.dyePunches, action.payload];
        state.successMessage = "Dye/Punch created successfully";
      })
      .addCase(createDyePunchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDyePunchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDyePunchThunk.fulfilled, (state, action: PayloadAction<DyePunch>) => {
        state.loading = false;
        state.dyePunches = state.dyePunches.map((d) => (d._id === action.payload._id ? action.payload : d));
        state.successMessage = "Dye/Punch updated successfully";
      })
      .addCase(updateDyePunchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDyePunchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDyePunchThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.dyePunches = state.dyePunches.filter((d) => d._id !== action.payload);
        state.successMessage = "Dye/Punch deleted successfully";
      })
      .addCase(deleteDyePunchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDyePunchError, clearDyePunchSuccessMessage } = dyePunchSlice.actions;
export default dyePunchSlice.reducer;
