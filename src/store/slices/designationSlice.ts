import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { designationService, Designation, CreateDesignationData } from "@/services/designation.service";

interface DesignationState {
  designations: Designation[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: DesignationState = { designations: [], loading: false, error: null, successMessage: null };

export const getAllDesignationsThunk = createAsyncThunk("designations/getAll", async (params: { status?: string; search?: string } | undefined, { rejectWithValue }) => {
  try {
    const response = await designationService.getAllDesignations(params);
    if (response.success && Array.isArray(response.data)) return response.data;
    return rejectWithValue(response.message || "Failed to fetch designations");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch designations");
  }
});

export const createDesignationThunk = createAsyncThunk("designations/create", async (data: CreateDesignationData, { rejectWithValue }) => {
  try {
    const response = await designationService.createDesignation(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create designation");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create designation");
  }
});

export const updateDesignationThunk = createAsyncThunk("designations/update", async ({ id, data }: { id: string; data: Partial<CreateDesignationData> }, { rejectWithValue }) => {
  try {
    const response = await designationService.updateDesignation(id, data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to update designation");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update designation");
  }
});

export const deleteDesignationThunk = createAsyncThunk("designations/delete", async (id: string, { rejectWithValue }) => {
  try {
    const response = await designationService.deleteDesignation(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete designation");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete designation");
  }
});

const designationSlice = createSlice({
  name: "designations",
  initialState,
  reducers: {
    clearDesignationError(state) {
      state.error = null;
    },
    clearDesignationSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllDesignationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllDesignationsThunk.fulfilled, (state, action: PayloadAction<Designation[]>) => {
        state.loading = false;
        state.designations = action.payload;
      })
      .addCase(getAllDesignationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.designations = [];
      })
      .addCase(createDesignationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDesignationThunk.fulfilled, (state, action: PayloadAction<Designation>) => {
        state.loading = false;
        state.designations = [...state.designations, action.payload];
        state.successMessage = "Unit of measure created successfully";
      })
      .addCase(createDesignationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDesignationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDesignationThunk.fulfilled, (state, action: PayloadAction<Designation>) => {
        state.loading = false;
        state.designations = state.designations.map((u) => (u._id === action.payload._id ? action.payload : u));
        state.successMessage = "Unit of measure updated successfully";
      })
      .addCase(updateDesignationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDesignationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDesignationThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.designations = state.designations.filter((u) => u._id !== action.payload);
        state.successMessage = "Unit of measure deleted successfully";
      })
      .addCase(deleteDesignationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDesignationError, clearDesignationSuccessMessage } = designationSlice.actions;
export default designationSlice.reducer;
