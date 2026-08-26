import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { vendorPaymentService, VendorPayment, VendorPaymentAllocationLine } from "@/services/vendorPayment.service";

interface VendorPaymentState {
  vendorPayments: VendorPayment[];
  singleVendorPayment: VendorPayment | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: VendorPaymentState = {
  vendorPayments: [],
  singleVendorPayment: null,
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

interface CreateVendorPaymentData {
  vendorId: string;
  purchaseOrderId?: string;
  companyName: string;
  amount: number;
  paymentDate: string;
  mode: string;
  referenceNumber?: string;
  notes?: string;
}

export const createVendorPaymentThunk = createAsyncThunk(
  "vendorPayment/create",
  async (data: CreateVendorPaymentData, { rejectWithValue }) => {
    try {
      const response = await vendorPaymentService.createVendorPayment(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to record vendor payment");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to record vendor payment");
    }
  }
);

interface CreateVendorPaymentAllocationData {
  vendorId: string;
  companyName: string;
  amount: number;
  paymentDate: string;
  mode: string;
  referenceNumber?: string;
  notes?: string;
  allocations: VendorPaymentAllocationLine[];
}

export const createVendorPaymentAllocationThunk = createAsyncThunk(
  "vendorPayment/allocate",
  async (data: CreateVendorPaymentAllocationData, { rejectWithValue }) => {
    try {
      const response = await vendorPaymentService.allocateVendorPayment(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to allocate vendor payment");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to allocate vendor payment");
    }
  }
);

export const getAllVendorPaymentsThunk = createAsyncThunk(
  "vendorPayment/getAll",
  async (params: { vendorId?: string; purchaseOrderId?: string; search?: string; page?: number; limit?: number; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await vendorPaymentService.getAllVendorPayments(params);
      if (response.success && Array.isArray(response.data)) {
        return { data: response.data, totalCount: response.pagination?.totalCount ?? response.data.length };
      }
      return rejectWithValue("Invalid response format: vendor payments array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch vendor payments");
    }
  }
);

export const getVendorPaymentByIdThunk = createAsyncThunk("vendorPayment/getById", async (id: string, { rejectWithValue }) => {
  try {
    const response = await vendorPaymentService.getVendorPaymentById(id);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Vendor payment not found");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch vendor payment");
  }
});

const vendorPaymentSlice = createSlice({
  name: "vendorPayment",
  initialState,
  reducers: {
    clearVendorPaymentError(state) {
      state.error = null;
    },
    clearVendorPaymentSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleVendorPayment(state) {
      state.singleVendorPayment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createVendorPaymentThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVendorPaymentThunk.fulfilled, (state, action: PayloadAction<VendorPayment>) => {
        state.loading = false;
        state.vendorPayments = [action.payload, ...state.vendorPayments];
        state.successMessage = "Vendor payment recorded successfully";
      })
      .addCase(createVendorPaymentThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createVendorPaymentAllocationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVendorPaymentAllocationThunk.fulfilled, (state, action: PayloadAction<VendorPayment>) => {
        state.loading = false;
        state.vendorPayments = [action.payload, ...state.vendorPayments];
        state.successMessage = "Vendor payment recorded and allocated successfully";
      })
      .addCase(createVendorPaymentAllocationThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllVendorPaymentsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllVendorPaymentsThunk.fulfilled, (state, action: PayloadAction<{ data: VendorPayment[]; totalCount: number }>) => {
        state.loading = false;
        state.vendorPayments = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(getAllVendorPaymentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.vendorPayments = [];
      })
      .addCase(getVendorPaymentByIdThunk.fulfilled, (state, action: PayloadAction<VendorPayment>) => {
        state.singleVendorPayment = action.payload;
      })
      .addCase(getVendorPaymentByIdThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearVendorPaymentError, clearVendorPaymentSuccessMessage, clearSingleVendorPayment } = vendorPaymentSlice.actions;
export default vendorPaymentSlice.reducer;
