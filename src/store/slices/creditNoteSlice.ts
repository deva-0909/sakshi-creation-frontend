import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { creditNoteService, CreditNote } from "@/services/creditNote.service";

interface CreditNoteState {
  creditNotes: CreditNote[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: CreditNoteState = {
  creditNotes: [],
  loading: false,
  error: null,
  successMessage: null,
};

export const createCreditNoteThunk = createAsyncThunk(
  "creditNote/create",
  async (data: { invoiceId: string; amount: number; reason?: string }, { rejectWithValue }) => {
    try {
      const response = await creditNoteService.createCreditNote(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create credit note");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create credit note");
    }
  }
);

export const issueCreditNoteThunk = createAsyncThunk("creditNote/issue", async (id: string, { rejectWithValue }) => {
  try {
    const response = await creditNoteService.issueCreditNote(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to issue credit note");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to issue credit note");
  }
});

export const cancelCreditNoteThunk = createAsyncThunk("creditNote/cancel", async (id: string, { rejectWithValue }) => {
  try {
    const response = await creditNoteService.cancelCreditNote(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to cancel credit note");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to cancel credit note");
  }
});

export const getAllCreditNotesThunk = createAsyncThunk(
  "creditNote/getAll",
  async (params: { invoiceId?: string; partyId?: string; status?: string; search?: string; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await creditNoteService.getAllCreditNotes(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue("Invalid response format: credit notes array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch credit notes");
    }
  }
);

const creditNoteSlice = createSlice({
  name: "creditNote",
  initialState,
  reducers: {
    clearCreditNoteError(state) {
      state.error = null;
    },
    clearCreditNoteSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCreditNoteThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCreditNoteThunk.fulfilled, (state, action: PayloadAction<CreditNote>) => {
        state.loading = false;
        state.creditNotes = [action.payload, ...state.creditNotes];
        state.successMessage = "Credit note created as Draft";
      })
      .addCase(createCreditNoteThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(issueCreditNoteThunk.fulfilled, (state, action: PayloadAction<CreditNote>) => {
        const index = state.creditNotes.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.creditNotes[index] = action.payload;
        state.successMessage = "Credit note issued and applied to invoice";
      })
      .addCase(issueCreditNoteThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(cancelCreditNoteThunk.fulfilled, (state, action: PayloadAction<CreditNote>) => {
        const index = state.creditNotes.findIndex((c) => c._id === action.payload._id);
        if (index !== -1) state.creditNotes[index] = action.payload;
        state.successMessage = "Credit note cancelled";
      })
      .addCase(cancelCreditNoteThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(getAllCreditNotesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCreditNotesThunk.fulfilled, (state, action: PayloadAction<CreditNote[]>) => {
        state.loading = false;
        state.creditNotes = action.payload;
      })
      .addCase(getAllCreditNotesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.creditNotes = [];
      });
  },
});

export const { clearCreditNoteError, clearCreditNoteSuccessMessage } = creditNoteSlice.actions;
export default creditNoteSlice.reducer;
