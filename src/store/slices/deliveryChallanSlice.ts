import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { deliveryChallanService, DeliveryChallan } from "@/services/deliveryChallan.service";

interface DeliveryChallanState {
  deliveryChallans: DeliveryChallan[];
  singleDeliveryChallan: DeliveryChallan | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: DeliveryChallanState = {
  deliveryChallans: [],
  singleDeliveryChallan: null,
  loading: false,
  error: null,
  successMessage: null,
};

export const createDeliveryChallanThunk = createAsyncThunk(
  "deliveryChallan/create",
  async (
    data: {
      orderId: string;
      quantityDelivered: number;
      vehicleNumber?: string;
      vehicleType?: string;
      driverName?: string;
      driverContact?: string;
      packageCount?: number;
      packageWeight?: number;
      deliveryDate?: string;
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await deliveryChallanService.createDeliveryChallan(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create delivery challan");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create delivery challan");
    }
  }
);

export const getAllDeliveryChallansThunk = createAsyncThunk(
  "deliveryChallan/getAll",
  async (params: { orderId?: string; status?: string; search?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await deliveryChallanService.getAllDeliveryChallans(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch delivery challans");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch delivery challans");
    }
  }
);

export const getDeliveryChallanByIdThunk = createAsyncThunk(
  "deliveryChallan/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await deliveryChallanService.getDeliveryChallanById(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to fetch delivery challan");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch delivery challan");
    }
  }
);

export const recordDeliveryChallanPodThunk = createAsyncThunk(
  "deliveryChallan/recordPod",
  async (
    { id, podReceivedBy, podDesignation, podNotes, podSignatureUrl }: { id: string; podReceivedBy: string; podDesignation?: string; podNotes?: string; podSignatureUrl?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await deliveryChallanService.recordProofOfDelivery(id, { podReceivedBy, podDesignation, podNotes, podSignatureUrl });
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to record proof of delivery");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to record proof of delivery");
    }
  }
);

export const cancelDeliveryChallanThunk = createAsyncThunk(
  "deliveryChallan/cancel",
  async ({ id, remarks }: { id: string; remarks: string }, { rejectWithValue }) => {
    try {
      const response = await deliveryChallanService.cancelDeliveryChallan(id, remarks);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to cancel delivery challan");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to cancel delivery challan");
    }
  }
);

const upsert = (state: DeliveryChallanState, updated: DeliveryChallan) => {
  state.deliveryChallans = state.deliveryChallans.map((c) => (c._id === updated._id ? updated : c));
  if (state.singleDeliveryChallan?._id === updated._id) state.singleDeliveryChallan = updated;
};

const deliveryChallanSlice = createSlice({
  name: "deliveryChallan",
  initialState,
  reducers: {
    clearDeliveryChallanError(state) {
      state.error = null;
    },
    clearDeliveryChallanSuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleDeliveryChallan(state) {
      state.singleDeliveryChallan = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createDeliveryChallanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDeliveryChallanThunk.fulfilled, (state, action: PayloadAction<DeliveryChallan>) => {
        state.loading = false;
        state.deliveryChallans = [action.payload, ...state.deliveryChallans];
        state.successMessage = "Delivery challan created successfully";
      })
      .addCase(createDeliveryChallanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllDeliveryChallansThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllDeliveryChallansThunk.fulfilled, (state, action: PayloadAction<DeliveryChallan[]>) => {
        state.loading = false;
        state.deliveryChallans = action.payload;
      })
      .addCase(getAllDeliveryChallansThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.deliveryChallans = [];
      })
      .addCase(getDeliveryChallanByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDeliveryChallanByIdThunk.fulfilled, (state, action: PayloadAction<DeliveryChallan>) => {
        state.loading = false;
        state.singleDeliveryChallan = action.payload;
      })
      .addCase(getDeliveryChallanByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(recordDeliveryChallanPodThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordDeliveryChallanPodThunk.fulfilled, (state, action: PayloadAction<DeliveryChallan>) => {
        state.loading = false;
        upsert(state, action.payload);
        state.successMessage = "Proof of delivery recorded successfully";
      })
      .addCase(recordDeliveryChallanPodThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelDeliveryChallanThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelDeliveryChallanThunk.fulfilled, (state, action: PayloadAction<DeliveryChallan>) => {
        state.loading = false;
        upsert(state, action.payload);
        state.successMessage = "Delivery challan cancelled successfully";
      })
      .addCase(cancelDeliveryChallanThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearDeliveryChallanError, clearDeliveryChallanSuccessMessage, clearSingleDeliveryChallan } = deliveryChallanSlice.actions;
export default deliveryChallanSlice.reducer;
