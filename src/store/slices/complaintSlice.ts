import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { complaintService, Complaint, CreateComplaintData, UpdateComplaintData } from "@/services/complaint.service";

interface ComplaintState {
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ComplaintState = {
  complaints: [],
  loading: false,
  error: null,
  successMessage: null,
};

export const getAllComplaintsThunk = createAsyncThunk(
  "complaints/getAll",
  async (params: { companyName?: string; search?: string; status?: string; priority?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await complaintService.getAllComplaints(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch complaints");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch complaints");
    }
  }
);

export const createComplaintThunk = createAsyncThunk(
  "complaints/create",
  async (data: CreateComplaintData, { rejectWithValue }) => {
    try {
      const response = await complaintService.createComplaint(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create complaint");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create complaint");
    }
  }
);

export const updateComplaintThunk = createAsyncThunk(
  "complaints/update",
  async ({ id, data }: { id: string; data: UpdateComplaintData }, { rejectWithValue }) => {
    try {
      const response = await complaintService.updateComplaint(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update complaint");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update complaint");
    }
  }
);

export const deleteComplaintThunk = createAsyncThunk(
  "complaints/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await complaintService.deleteComplaint(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete complaint");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete complaint");
    }
  }
);

const complaintSlice = createSlice({
  name: "complaints",
  initialState,
  reducers: {
    clearComplaintError(state) {
      state.error = null;
    },
    clearComplaintSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllComplaintsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllComplaintsThunk.fulfilled, (state, action: PayloadAction<Complaint[]>) => {
        state.loading = false;
        state.complaints = action.payload;
      })
      .addCase(getAllComplaintsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.complaints = [];
      })
      .addCase(createComplaintThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createComplaintThunk.fulfilled, (state, action: PayloadAction<Complaint>) => {
        state.loading = false;
        state.complaints = [action.payload, ...state.complaints];
        state.successMessage = "Complaint created successfully";
      })
      .addCase(createComplaintThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateComplaintThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateComplaintThunk.fulfilled, (state, action: PayloadAction<Complaint>) => {
        state.loading = false;
        state.complaints = state.complaints.map((c) => (c._id === action.payload._id ? action.payload : c));
        state.successMessage = "Complaint updated successfully";
      })
      .addCase(updateComplaintThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteComplaintThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteComplaintThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.complaints = state.complaints.filter((c) => c._id !== action.payload);
        state.successMessage = "Complaint deleted successfully";
      })
      .addCase(deleteComplaintThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearComplaintError, clearComplaintSuccessMessage } = complaintSlice.actions;
export default complaintSlice.reducer;
