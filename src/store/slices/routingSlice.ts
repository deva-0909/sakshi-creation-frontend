import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  routingService,
  ProcessStage,
  CreateProcessStageData,
  RoutingTemplate,
  CreateRoutingTemplateData,
  UpdateRoutingTemplateData,
} from "@/services/routing.service";

interface RoutingState {
  processStages: ProcessStage[];
  routingTemplates: RoutingTemplate[];
  suggestedTemplate: RoutingTemplate | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: RoutingState = {
  processStages: [],
  routingTemplates: [],
  suggestedTemplate: null,
  loading: false,
  error: null,
  successMessage: null,
};

// -- Process Stage thunks --
export const getAllProcessStagesThunk = createAsyncThunk("routing/getAllStages", async (params: { status?: string } | undefined, { rejectWithValue }) => {
  try {
    const response = await routingService.getAllProcessStages(params);
    if (response.success && Array.isArray(response.data)) return response.data;
    return rejectWithValue(response.message || "Failed to fetch process stages");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to fetch process stages");
  }
});

export const createProcessStageThunk = createAsyncThunk("routing/createStage", async (data: CreateProcessStageData, { rejectWithValue }) => {
  try {
    const response = await routingService.createProcessStage(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create process stage");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create process stage");
  }
});

export const updateProcessStageThunk = createAsyncThunk(
  "routing/updateStage",
  async ({ id, data }: { id: string; data: Partial<CreateProcessStageData> }, { rejectWithValue }) => {
    try {
      const response = await routingService.updateProcessStage(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update process stage");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update process stage");
    }
  }
);

export const deleteProcessStageThunk = createAsyncThunk("routing/deleteStage", async (id: string, { rejectWithValue }) => {
  try {
    const response = await routingService.deleteProcessStage(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete process stage");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete process stage");
  }
});

// -- Routing Template thunks --
export const getAllRoutingTemplatesThunk = createAsyncThunk(
  "routing/getAllTemplates",
  async (params: { productItemId?: string; status?: string } | undefined, { rejectWithValue }) => {
    try {
      const response = await routingService.getAllRoutingTemplates(params);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch routing templates");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch routing templates");
    }
  }
);

export const createRoutingTemplateThunk = createAsyncThunk("routing/createTemplate", async (data: CreateRoutingTemplateData, { rejectWithValue }) => {
  try {
    const response = await routingService.createRoutingTemplate(data);
    if (response.success && response.data) return response.data;
    return rejectWithValue(response.message || "Failed to create routing template");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to create routing template");
  }
});

export const updateRoutingTemplateThunk = createAsyncThunk(
  "routing/updateTemplate",
  async ({ id, data }: { id: string; data: UpdateRoutingTemplateData }, { rejectWithValue }) => {
    try {
      const response = await routingService.updateRoutingTemplate(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update routing template");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update routing template");
    }
  }
);

export const deleteRoutingTemplateThunk = createAsyncThunk("routing/deleteTemplate", async (id: string, { rejectWithValue }) => {
  try {
    const response = await routingService.deleteRoutingTemplate(id);
    if (response.success) return id;
    return rejectWithValue(response.message || "Failed to delete routing template");
  } catch (error: any) {
    return rejectWithValue(error.message || "Failed to delete routing template");
  }
});

export const getSuggestedRoutingTemplateThunk = createAsyncThunk(
  "routing/getSuggestedTemplate",
  async (productItemId: string | undefined, { rejectWithValue }) => {
    try {
      const response = await routingService.getSuggestedRoutingTemplate(productItemId);
      if (response.success) return response.data ?? null;
      return rejectWithValue(response.message || "Failed to fetch suggested routing");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch suggested routing");
    }
  }
);

const routingSlice = createSlice({
  name: "routing",
  initialState,
  reducers: {
    clearRoutingError(state) {
      state.error = null;
    },
    clearRoutingSuccessMessage(state) {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllProcessStagesThunk.fulfilled, (state, action: PayloadAction<ProcessStage[]>) => {
        state.processStages = action.payload;
      })
      .addCase(createProcessStageThunk.fulfilled, (state, action: PayloadAction<ProcessStage>) => {
        state.processStages = [...state.processStages, action.payload];
        state.successMessage = "Process stage created successfully";
      })
      .addCase(updateProcessStageThunk.fulfilled, (state, action: PayloadAction<ProcessStage>) => {
        state.processStages = state.processStages.map((s) => (s._id === action.payload._id ? action.payload : s));
        state.successMessage = "Process stage updated successfully";
      })
      .addCase(deleteProcessStageThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.processStages = state.processStages.filter((s) => s._id !== action.payload);
        state.successMessage = "Process stage deleted successfully";
      })
      .addCase(getAllRoutingTemplatesThunk.fulfilled, (state, action: PayloadAction<RoutingTemplate[]>) => {
        state.routingTemplates = action.payload;
      })
      .addCase(createRoutingTemplateThunk.fulfilled, (state, action: PayloadAction<RoutingTemplate>) => {
        state.routingTemplates = [...state.routingTemplates, action.payload];
        state.successMessage = "Routing template created successfully";
      })
      .addCase(updateRoutingTemplateThunk.fulfilled, (state, action: PayloadAction<RoutingTemplate>) => {
        state.routingTemplates = state.routingTemplates.map((t) => (t._id === action.payload._id ? action.payload : t));
        state.successMessage = "Routing template updated successfully";
      })
      .addCase(deleteRoutingTemplateThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.routingTemplates = state.routingTemplates.filter((t) => t._id !== action.payload);
        state.successMessage = "Routing template deleted successfully";
      })
      .addCase(getSuggestedRoutingTemplateThunk.fulfilled, (state, action: PayloadAction<RoutingTemplate | null>) => {
        state.suggestedTemplate = action.payload;
      })
      .addMatcher(
        (action) => action.type.startsWith("routing/") && action.type.endsWith("/pending"),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("routing/") && (action.type.endsWith("/fulfilled") || action.type.endsWith("/rejected")),
        (state) => {
          state.loading = false;
        }
      )
      .addMatcher(
        (action) => action.type.startsWith("routing/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.error = action.payload as string;
        }
      );
  },
});

export const { clearRoutingError, clearRoutingSuccessMessage } = routingSlice.actions;
export default routingSlice.reducer;
