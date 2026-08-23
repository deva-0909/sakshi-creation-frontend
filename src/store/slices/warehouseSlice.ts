import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { warehouseService, Warehouse, CreateWarehouseData } from "@/services/warehouse.service";

interface WarehouseState {
  warehouses: Warehouse[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: WarehouseState = { warehouses: [], loading: false, error: null, successMessage: null };

export const getAllWarehousesThunk = createAsyncThunk(
  "warehouses/getAll",
  async (params: { status?: string; companyName?: string; search?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await warehouseService.getAllWarehouses(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch warehouses");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch warehouses");
    }
  }
);

export const createWarehouseThunk = createAsyncThunk("warehouses/create", async (data: CreateWarehouseData, { rejectWithValue }) => {
  try {
    const response = await warehouseService.createWarehouse(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create warehouse");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create warehouse");
  }
});

export const updateWarehouseThunk = createAsyncThunk("warehouses/update", async ({ id, data }: { id: string; data: Partial<CreateWarehouseData> }, { rejectWithValue }) => {
  try {
    const response = await warehouseService.updateWarehouse(id, data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to update warehouse");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to update warehouse");
  }
});

export const deleteWarehouseThunk = createAsyncThunk("warehouses/delete", async (id: string, { rejectWithValue }) => {
  try {
    const response = await warehouseService.deleteWarehouse(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete warehouse");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete warehouse");
  }
});

const warehouseSlice = createSlice({
  name: "warehouses",
  initialState,
  reducers: {
    clearWarehouseError(state) {
      state.error = null;
    },
    clearWarehouseSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllWarehousesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllWarehousesThunk.fulfilled, (state, action: PayloadAction<Warehouse[]>) => {
        state.loading = false;
        state.warehouses = action.payload;
      })
      .addCase(getAllWarehousesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.warehouses = [];
      })
      .addCase(createWarehouseThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWarehouseThunk.fulfilled, (state, action: PayloadAction<Warehouse>) => {
        state.loading = false;
        state.warehouses = [...state.warehouses, action.payload];
        state.successMessage = "Warehouse created successfully";
      })
      .addCase(createWarehouseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateWarehouseThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWarehouseThunk.fulfilled, (state, action: PayloadAction<Warehouse>) => {
        state.loading = false;
        state.warehouses = state.warehouses.map((w) => (w._id === action.payload._id ? action.payload : w));
        state.successMessage = "Warehouse updated successfully";
      })
      .addCase(updateWarehouseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteWarehouseThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWarehouseThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.warehouses = state.warehouses.filter((w) => w._id !== action.payload);
        state.successMessage = "Warehouse deleted successfully";
      })
      .addCase(deleteWarehouseThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearWarehouseError, clearWarehouseSuccessMessage } = warehouseSlice.actions;
export default warehouseSlice.reducer;
