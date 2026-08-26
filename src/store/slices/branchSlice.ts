import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { branchService, Branch, CreateBranchData } from "@/services/branch.service";

interface BranchState {
  branches: Branch[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: BranchState = { branches: [], loading: false, error: null, successMessage: null };

export const getAllBranchesThunk = createAsyncThunk("branches/getAll", async (params: { status?: string; search?: string; companyName?: string } | undefined, { rejectWithValue }) => {
  try {
    const response = await branchService.getAllBranches(params);
    if (response.success && Array.isArray(response.data)) return response.data;
    return rejectWithValue(response.message || "Failed to fetch branches");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch branches");
  }
});

export const createBranchThunk = createAsyncThunk("branches/create", async (data: CreateBranchData, { rejectWithValue }) => {
  try {
    const response = await branchService.createBranch(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create branch");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create branch");
  }
});

export const updateBranchThunk = createAsyncThunk("branches/update", async ({ id, data }: { id: string; data: Partial<CreateBranchData> }, { rejectWithValue }) => {
  try {
    const response = await branchService.updateBranch(id, data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to update branch");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update branch");
  }
});

export const deleteBranchThunk = createAsyncThunk("branches/delete", async (id: string, { rejectWithValue }) => {
  try {
    const response = await branchService.deleteBranch(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete branch");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete branch");
  }
});

const branchSlice = createSlice({
  name: "branches",
  initialState,
  reducers: {
    clearBranchError(state) {
      state.error = null;
    },
    clearBranchSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllBranchesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBranchesThunk.fulfilled, (state, action: PayloadAction<Branch[]>) => {
        state.loading = false;
        state.branches = action.payload;
      })
      .addCase(getAllBranchesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.branches = [];
      })
      .addCase(createBranchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBranchThunk.fulfilled, (state, action: PayloadAction<Branch>) => {
        state.loading = false;
        state.branches = [...state.branches, action.payload];
        state.successMessage = "Branch created successfully";
      })
      .addCase(createBranchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateBranchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBranchThunk.fulfilled, (state, action: PayloadAction<Branch>) => {
        state.loading = false;
        state.branches = state.branches.map((u) => (u._id === action.payload._id ? action.payload : u));
        state.successMessage = "Branch updated successfully";
      })
      .addCase(updateBranchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteBranchThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBranchThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.branches = state.branches.filter((u) => u._id !== action.payload);
        state.successMessage = "Branch deleted successfully";
      })
      .addCase(deleteBranchThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearBranchError, clearBranchSuccessMessage } = branchSlice.actions;
export default branchSlice.reducer;
