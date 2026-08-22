import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { taxRateService, TaxRate, CreateTaxRateData } from "@/services/taxRate.service";

interface TaxRateState {
  taxRates: TaxRate[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: TaxRateState = { taxRates: [], loading: false, error: null, successMessage: null };

export const getAllTaxRatesThunk = createAsyncThunk("taxRates/getAll", async (params: { status?: string; search?: string } | undefined, { rejectWithValue }) => {
  try {
    const response = await taxRateService.getAllTaxRates(params);
    if (response.success && Array.isArray(response.data)) return response.data;
    return rejectWithValue(response.message || "Failed to fetch tax rates");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch tax rates");
  }
});

export const createTaxRateThunk = createAsyncThunk("taxRates/create", async (data: CreateTaxRateData, { rejectWithValue }) => {
  try {
    const response = await taxRateService.createTaxRate(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create tax rate");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create tax rate");
  }
});

export const updateTaxRateThunk = createAsyncThunk("taxRates/update", async ({ id, data }: { id: string; data: Partial<CreateTaxRateData> }, { rejectWithValue }) => {
  try {
    const response = await taxRateService.updateTaxRate(id, data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to update tax rate");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update tax rate");
  }
});

export const deleteTaxRateThunk = createAsyncThunk("taxRates/delete", async (id: string, { rejectWithValue }) => {
  try {
    const response = await taxRateService.deleteTaxRate(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete tax rate");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete tax rate");
  }
});

const taxRateSlice = createSlice({
  name: "taxRates",
  initialState,
  reducers: {
    clearTaxRateError(state) {
      state.error = null;
    },
    clearTaxRateSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllTaxRatesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllTaxRatesThunk.fulfilled, (state, action: PayloadAction<TaxRate[]>) => {
        state.loading = false;
        state.taxRates = action.payload;
      })
      .addCase(getAllTaxRatesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.taxRates = [];
      })
      .addCase(createTaxRateThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createTaxRateThunk.fulfilled, (state, action: PayloadAction<TaxRate>) => {
        state.loading = false;
        state.taxRates = [...state.taxRates, action.payload];
        state.successMessage = "Unit of measure created successfully";
      })
      .addCase(createTaxRateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateTaxRateThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateTaxRateThunk.fulfilled, (state, action: PayloadAction<TaxRate>) => {
        state.loading = false;
        state.taxRates = state.taxRates.map((u) => (u._id === action.payload._id ? action.payload : u));
        state.successMessage = "Unit of measure updated successfully";
      })
      .addCase(updateTaxRateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteTaxRateThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteTaxRateThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.taxRates = state.taxRates.filter((u) => u._id !== action.payload);
        state.successMessage = "Unit of measure deleted successfully";
      })
      .addCase(deleteTaxRateThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearTaxRateError, clearTaxRateSuccessMessage } = taxRateSlice.actions;
export default taxRateSlice.reducer;
