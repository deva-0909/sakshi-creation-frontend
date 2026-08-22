import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { jobCardService, JobCard, JobCardStage, MaterialUsage, WastageReportRow } from "@/services/jobCard.service";

interface JobCardState {
  jobCards: JobCard[];
  singleJobCard: JobCard | null;
  stageHistory: JobCardStage[];
  wastageReport: WastageReportRow[];
  loading: boolean;
  wastageReportLoading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: JobCardState = {
  jobCards: [],
  singleJobCard: null,
  stageHistory: [],
  wastageReport: [],
  loading: false,
  wastageReportLoading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

export const createJobCardThunk = createAsyncThunk(
  "jobCard/create",
  async ({ orderId, data }: { orderId: string; data: { priority?: string; dueDate?: string } }, { rejectWithValue }) => {
    try {
      const response = await jobCardService.createJobCard(orderId, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create job card");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create job card");
    }
  }
);

export const getAllJobCardsThunk = createAsyncThunk(
  "jobCard/getAll",
  async (params: { status?: string; priority?: string; assignedTo?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await jobCardService.getAllJobCards(params);
      if (response.success && Array.isArray(response.data)) {
        return { data: response.data, totalCount: response.pagination?.totalCount ?? response.data.length };
      }
      return rejectWithValue("Invalid response format: job cards array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch job cards");
    }
  }
);

export const getJobCardByIdThunk = createAsyncThunk(
  "jobCard/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await jobCardService.getJobCardById(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Job card not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch job card");
    }
  }
);

export const updateJobCardThunk = createAsyncThunk(
  "jobCard/update",
  async ({ id, data }: { id: string; data: { priority?: string; dueDate?: string; assignedTo?: string; status?: string } }, { rejectWithValue }) => {
    try {
      const response = await jobCardService.updateJobCard(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update job card");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update job card");
    }
  }
);

export const deleteJobCardThunk = createAsyncThunk(
  "jobCard/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await jobCardService.deleteJobCard(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete job card");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete job card");
    }
  }
);

interface AdvanceStageData {
  stage: string;
  assignedTo?: string;
  status: string;
  remarks?: string;
  machine?: string;
  completedQty?: number;
  rejectedQty?: number;
  reworkQty?: number;
  qcResult?: "Passed" | "Failed";
  defectCategory?: string;
  defectReason?: string;
  wastedSheet?: number;
  wastageReason?: string;
  wastageMaterial?: string;
  wastageForRole?: string;
  wastageForCompany?: string;
}

export const advanceJobCardStageThunk = createAsyncThunk(
  "jobCard/advanceStage",
  async ({ id, data }: { id: string; data: AdvanceStageData }, { rejectWithValue }) => {
    try {
      const response = await jobCardService.advanceStage(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to advance stage");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to advance stage");
    }
  }
);

export const getJobCardStageHistoryThunk = createAsyncThunk(
  "jobCard/getStageHistory",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await jobCardService.getStageHistory(id);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch stage history");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch stage history");
    }
  }
);

export const recordMaterialUsageThunk = createAsyncThunk(
  "jobCard/recordMaterialUsage",
  async (
    { id, data }: { id: string; data: { jobCardStageId?: string; material: string; bom?: string; quantityUsed: number; forRole: string; forCompany: string } },
    { rejectWithValue }
  ) => {
    try {
      const response = await jobCardService.recordMaterialUsage(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to record material usage");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to record material usage");
    }
  }
);

export const getWastageReportThunk = createAsyncThunk(
  "jobCard/getWastageReport",
  async (params: { from?: string; to?: string; materialId?: string; stage?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await jobCardService.getWastageReport(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch wastage report");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch wastage report");
    }
  }
);

const jobCardSlice = createSlice({
  name: "jobCard",
  initialState,
  reducers: {
    clearJobCardError(state) {
      state.error = null;
    },
    clearJobCardSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleJobCard(state) {
      state.singleJobCard = null;
      state.stageHistory = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createJobCardThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createJobCardThunk.fulfilled, (state, action: PayloadAction<JobCard>) => {
        state.loading = false;
        state.jobCards = [action.payload, ...state.jobCards];
        state.singleJobCard = action.payload;
        state.successMessage = "Job card created successfully";
      })
      .addCase(createJobCardThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllJobCardsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllJobCardsThunk.fulfilled, (state, action: PayloadAction<{ data: JobCard[]; totalCount: number }>) => {
        state.loading = false;
        state.jobCards = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(getAllJobCardsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.jobCards = [];
      })
      .addCase(getJobCardByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getJobCardByIdThunk.fulfilled, (state, action: PayloadAction<JobCard>) => {
        state.loading = false;
        state.singleJobCard = action.payload;
      })
      .addCase(getJobCardByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateJobCardThunk.fulfilled, (state, action: PayloadAction<JobCard>) => {
        state.singleJobCard = action.payload;
        const index = state.jobCards.findIndex((j) => j._id === action.payload._id);
        if (index !== -1) state.jobCards[index] = action.payload;
        state.successMessage = "Job card updated successfully";
      })
      .addCase(updateJobCardThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(deleteJobCardThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.jobCards = state.jobCards.filter((j) => j._id !== action.payload);
        state.successMessage = "Job card deleted successfully";
      })
      .addCase(deleteJobCardThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(advanceJobCardStageThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(advanceJobCardStageThunk.fulfilled, (state, action: PayloadAction<{ jobCard: JobCard; stage: JobCardStage }>) => {
        state.loading = false;
        state.singleJobCard = action.payload.jobCard;
        const index = state.jobCards.findIndex((j) => j._id === action.payload.jobCard._id);
        if (index !== -1) state.jobCards[index] = action.payload.jobCard;
        state.successMessage = "Stage updated successfully";
      })
      .addCase(advanceJobCardStageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getJobCardStageHistoryThunk.fulfilled, (state, action: PayloadAction<JobCardStage[]>) => {
        state.stageHistory = action.payload;
      })
      .addCase(recordMaterialUsageThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordMaterialUsageThunk.fulfilled, (state) => {
        state.loading = false;
        state.successMessage = "Material usage recorded and inventory updated";
      })
      .addCase(recordMaterialUsageThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getWastageReportThunk.pending, (state) => {
        state.wastageReportLoading = true;
        state.error = null;
      })
      .addCase(getWastageReportThunk.fulfilled, (state, action: PayloadAction<WastageReportRow[]>) => {
        state.wastageReportLoading = false;
        state.wastageReport = action.payload;
      })
      .addCase(getWastageReportThunk.rejected, (state, action) => {
        state.wastageReportLoading = false;
        state.error = action.payload as string;
        state.wastageReport = [];
      });
  },
});

export const { clearJobCardError, clearJobCardSuccessMessage, clearSingleJobCard } = jobCardSlice.actions;
export default jobCardSlice.reducer;
