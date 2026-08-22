import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { approvalService, PendingApproval } from "@/services/approval.service";

interface ApprovalState {
  pending: PendingApproval[];
  loading: boolean;
  error: string | null;
}

const initialState: ApprovalState = {
  pending: [],
  loading: false,
  error: null,
};

export const getMyPendingApprovalsThunk = createAsyncThunk("approval/getMine", async (_: void, { rejectWithValue }) => {
  try {
    const response = await approvalService.getMyPendingApprovals();
    if (response.success && Array.isArray(response.data)) return response.data;
    return rejectWithValue(response.message || "Failed to fetch pending approvals");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch pending approvals");
  }
});

const approvalSlice = createSlice({
  name: "approval",
  initialState,
  reducers: {
    clearApprovalError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getMyPendingApprovalsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyPendingApprovalsThunk.fulfilled, (state, action: PayloadAction<PendingApproval[]>) => {
        state.loading = false;
        state.pending = action.payload;
      })
      .addCase(getMyPendingApprovalsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearApprovalError } = approvalSlice.actions;
export default approvalSlice.reducer;
