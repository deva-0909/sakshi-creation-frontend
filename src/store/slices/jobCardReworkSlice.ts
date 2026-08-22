import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { jobCardReworkService } from "@/services/jobCardRework.service";
import { JobCardRework } from "@/services/jobCard.service";

interface JobCardReworkState {
  reworks: JobCardRework[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: JobCardReworkState = {
  reworks: [],
  loading: false,
  error: null,
  successMessage: null,
};

interface CreateReworkData {
  jobCardStageId?: string;
  reason: string;
  defectCategory?: string;
  quantity?: number;
  responsibleDepartment?: string;
  responsibleStaff?: string;
  additionalMaterialNotes?: string;
  cost?: number;
}

export const createReworkThunk = createAsyncThunk(
  "jobCardRework/create",
  async ({ jobCardId, data }: { jobCardId: string; data: CreateReworkData }, { rejectWithValue }) => {
    try {
      const response = await jobCardReworkService.createRework(jobCardId, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create rework record");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create rework record");
    }
  }
);

export const getReworksForJobCardThunk = createAsyncThunk(
  "jobCardRework/getForJobCard",
  async (jobCardId: string, { rejectWithValue }) => {
    try {
      const response = await jobCardReworkService.getReworksForJobCard(jobCardId);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch rework records");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch rework records");
    }
  }
);

export const startReworkThunk = createAsyncThunk(
  "jobCardRework/start",
  async ({ jobCardId, reworkId }: { jobCardId: string; reworkId: string }, { rejectWithValue }) => {
    try {
      const response = await jobCardReworkService.startRework(jobCardId, reworkId);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to start rework");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to start rework");
    }
  }
);

export const submitReworkForApprovalThunk = createAsyncThunk(
  "jobCardRework/submit",
  async ({ jobCardId, reworkId }: { jobCardId: string; reworkId: string }, { rejectWithValue }) => {
    try {
      const response = await jobCardReworkService.submitReworkForApproval(jobCardId, reworkId);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to submit rework for approval");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit rework for approval");
    }
  }
);

export const approveReworkThunk = createAsyncThunk(
  "jobCardRework/approve",
  async ({ jobCardId, reworkId }: { jobCardId: string; reworkId: string }, { rejectWithValue }) => {
    try {
      const response = await jobCardReworkService.approveRework(jobCardId, reworkId);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to approve rework");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to approve rework");
    }
  }
);

export const rejectReworkThunk = createAsyncThunk(
  "jobCardRework/reject",
  async ({ jobCardId, reworkId, remarks }: { jobCardId: string; reworkId: string; remarks: string }, { rejectWithValue }) => {
    try {
      const response = await jobCardReworkService.rejectRework(jobCardId, reworkId, remarks);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to reject rework");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to reject rework");
    }
  }
);

function upsert(state: JobCardReworkState, updated: JobCardRework) {
  const index = state.reworks.findIndex((r) => r._id === updated._id);
  if (index !== -1) state.reworks[index] = updated;
  else state.reworks = [updated, ...state.reworks];
}

const jobCardReworkSlice = createSlice({
  name: "jobCardRework",
  initialState,
  reducers: {
    clearJobCardReworkError(state) {
      state.error = null;
    },
    clearJobCardReworkSuccessMessage(state) {
      state.successMessage = null;
    },
    clearReworks(state) {
      state.reworks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createReworkThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createReworkThunk.fulfilled, (state, action: PayloadAction<JobCardRework>) => {
        state.loading = false;
        state.reworks = [action.payload, ...state.reworks];
        state.successMessage = "Rework record created";
      })
      .addCase(createReworkThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getReworksForJobCardThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getReworksForJobCardThunk.fulfilled, (state, action: PayloadAction<JobCardRework[]>) => {
        state.loading = false;
        state.reworks = action.payload;
      })
      .addCase(getReworksForJobCardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.reworks = [];
      })
      .addCase(startReworkThunk.fulfilled, (state, action: PayloadAction<JobCardRework>) => {
        upsert(state, action.payload);
        state.successMessage = "Rework moved to In Progress";
      })
      .addCase(startReworkThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(submitReworkForApprovalThunk.fulfilled, (state, action: PayloadAction<JobCardRework>) => {
        upsert(state, action.payload);
        state.successMessage = "Rework submitted for approval";
      })
      .addCase(submitReworkForApprovalThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(approveReworkThunk.fulfilled, (state, action: PayloadAction<JobCardRework>) => {
        upsert(state, action.payload);
        state.successMessage = "Rework approved";
      })
      .addCase(approveReworkThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(rejectReworkThunk.fulfilled, (state, action: PayloadAction<JobCardRework>) => {
        upsert(state, action.payload);
        state.successMessage = "Rework rejected";
      })
      .addCase(rejectReworkThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearJobCardReworkError, clearJobCardReworkSuccessMessage, clearReworks } = jobCardReworkSlice.actions;
export default jobCardReworkSlice.reducer;
