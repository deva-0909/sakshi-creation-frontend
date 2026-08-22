import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { debitNoteService, DebitNote } from "@/services/debitNote.service";

interface DebitNoteState {
  debitNotes: DebitNote[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: DebitNoteState = {
  debitNotes: [],
  loading: false,
  error: null,
  successMessage: null,
};

export const createDebitNoteThunk = createAsyncThunk(
  "debitNote/create",
  async (data: { vendorId: string; purchaseOrderId?: string; companyName: string; amount: number; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await debitNoteService.createDebitNote(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create debit note");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create debit note");
    }
  }
);

export const issueDebitNoteThunk = createAsyncThunk("debitNote/issue", async (id: string, { rejectWithValue }) => {
  try {
    const response = await debitNoteService.issueDebitNote(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to issue debit note");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to issue debit note");
  }
});

export const cancelDebitNoteThunk = createAsyncThunk("debitNote/cancel", async (id: string, { rejectWithValue }) => {
  try {
    const response = await debitNoteService.cancelDebitNote(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to cancel debit note");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to cancel debit note");
  }
});

export const getAllDebitNotesThunk = createAsyncThunk(
  "debitNote/getAll",
  async (params: { vendorId?: string; purchaseOrderId?: string; status?: string; search?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await debitNoteService.getAllDebitNotes(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue("Invalid response format: debit notes array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch debit notes");
    }
  }
);

const debitNoteSlice = createSlice({
  name: "debitNote",
  initialState,
  reducers: {
    clearDebitNoteError(state) {
      state.error = null;
    },
    clearDebitNoteSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDebitNoteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDebitNoteThunk.fulfilled, (state, action: PayloadAction<DebitNote>) => {
        state.loading = false;
        state.debitNotes = [action.payload, ...state.debitNotes];
        state.successMessage = "Debit note created as Draft";
      })
      .addCase(createDebitNoteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(issueDebitNoteThunk.fulfilled, (state, action: PayloadAction<DebitNote>) => {
        const index = state.debitNotes.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) state.debitNotes[index] = action.payload;
        state.successMessage = "Debit note issued";
      })
      .addCase(issueDebitNoteThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(cancelDebitNoteThunk.fulfilled, (state, action: PayloadAction<DebitNote>) => {
        const index = state.debitNotes.findIndex((d) => d._id === action.payload._id);
        if (index !== -1) state.debitNotes[index] = action.payload;
        state.successMessage = "Debit note cancelled";
      })
      .addCase(cancelDebitNoteThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(getAllDebitNotesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllDebitNotesThunk.fulfilled, (state, action: PayloadAction<DebitNote[]>) => {
        state.loading = false;
        state.debitNotes = action.payload;
      })
      .addCase(getAllDebitNotesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.debitNotes = [];
      });
  },
});

export const { clearDebitNoteError, clearDebitNoteSuccessMessage } = debitNoteSlice.actions;
export default debitNoteSlice.reducer;
