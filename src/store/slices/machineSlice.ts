import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { machineService, Machine, CreateMachineData } from "@/services/machine.service";

interface MachineState {
  machines: Machine[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: MachineState = {
  machines: [],
  loading: false,
  error: null,
  successMessage: null,
};

export const getAllMachinesThunk = createAsyncThunk(
  "machines/getAll",
  async (params: { category?: string; status?: string; companyName?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await machineService.getAllMachines(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch machines");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch machines");
    }
  }
);

export const createMachineThunk = createAsyncThunk(
  "machines/create",
  async (data: CreateMachineData, { rejectWithValue }) => {
    try {
      const response = await machineService.createMachine(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create machine");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create machine");
    }
  }
);

export const updateMachineThunk = createAsyncThunk(
  "machines/update",
  async ({ id, data }: { id: string; data: Partial<CreateMachineData> }, { rejectWithValue }) => {
    try {
      const response = await machineService.updateMachine(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update machine");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update machine");
    }
  }
);

export const deleteMachineThunk = createAsyncThunk(
  "machines/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await machineService.deleteMachine(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete machine");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete machine");
    }
  }
);

const machineSlice = createSlice({
  name: "machines",
  initialState,
  reducers: {
    clearMachineError(state) {
      state.error = null;
    },
    clearMachineSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllMachinesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllMachinesThunk.fulfilled, (state, action: PayloadAction<Machine[]>) => {
        state.loading = false;
        state.machines = action.payload;
      })
      .addCase(getAllMachinesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.machines = [];
      })
      .addCase(createMachineThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMachineThunk.fulfilled, (state, action: PayloadAction<Machine>) => {
        state.loading = false;
        state.machines = [...state.machines, action.payload];
        state.successMessage = "Machine created successfully";
      })
      .addCase(createMachineThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateMachineThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMachineThunk.fulfilled, (state, action: PayloadAction<Machine>) => {
        state.loading = false;
        state.machines = state.machines.map((m) => (m._id === action.payload._id ? action.payload : m));
        state.successMessage = "Machine updated successfully";
      })
      .addCase(updateMachineThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteMachineThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMachineThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.machines = state.machines.filter((m) => m._id !== action.payload);
        state.successMessage = "Machine deleted successfully";
      })
      .addCase(deleteMachineThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearMachineError, clearMachineSuccessMessage } = machineSlice.actions;
export default machineSlice.reducer;
