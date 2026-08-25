import { createSlice, createAsyncThunk, isAnyOf, type PayloadAction } from "@reduxjs/toolkit";
import { opportunityService, Opportunity, OpportunityHistoryEntry, OpportunityActivity } from "@/services/opportunity.service";

interface OpportunityState {
  opportunities: Opportunity[];
  singleOpportunity: Opportunity | null;
  history: OpportunityHistoryEntry[];
  activities: OpportunityActivity[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
  totalCount: number;
}

const initialState: OpportunityState = {
  opportunities: [],
  singleOpportunity: null,
  history: [],
  activities: [],
  loading: false,
  error: null,
  successMessage: null,
  totalCount: 0,
};

interface CreateOpportunityData {
  companyName: string;
  prospectName: string;
  contactPerson?: string;
  contactPhone: string;
  contactEmail?: string;
  estimatedValue?: number;
  source?: string;
  assignedTo?: string;
  notes?: string;
  followUpDate?: string;
}

interface ConvertToQuotationData {
  productItem: string;
  qty: number;
  size?: string;
  specs?: Record<string, any>;
  rateType?: string;
  rate?: number;
  printingrate?: number;
  isGst?: boolean;
  gstPercentage?: number;
  totalAmount?: number;
  validUntil?: string;
  remarks?: string;
}

export const createOpportunityThunk = createAsyncThunk(
  "opportunity/create",
  async (data: CreateOpportunityData, { rejectWithValue }) => {
    try {
      const response = await opportunityService.createOpportunity(data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to create opportunity");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to create opportunity");
    }
  }
);

export const getAllOpportunitiesThunk = createAsyncThunk(
  "opportunity/getAll",
  async (params: { stage?: string; partyId?: string; assignedTo?: string; search?: string; page?: number; limit?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await opportunityService.getAllOpportunities(params);
      if (response.success && Array.isArray(response.data)) {
        return { data: response.data, totalCount: response.pagination?.totalCount ?? response.data.length };
      }
      return rejectWithValue("Invalid response format: opportunities array not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch opportunities");
    }
  }
);

export const getOpportunityByIdThunk = createAsyncThunk(
  "opportunity/getById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.getOpportunityById(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Opportunity not found");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch opportunity");
    }
  }
);

export const updateOpportunityThunk = createAsyncThunk(
  "opportunity/update",
  async ({ id, data }: { id: string; data: Partial<CreateOpportunityData> }, { rejectWithValue }) => {
    try {
      const response = await opportunityService.updateOpportunity(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to update opportunity");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update opportunity");
    }
  }
);

export const deleteOpportunityThunk = createAsyncThunk(
  "opportunity/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.deleteOpportunity(id);
      if (response.success) return id;
      return rejectWithValue(response.message || "Failed to delete opportunity");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete opportunity");
    }
  }
);

export const markContactedThunk = createAsyncThunk(
  "opportunity/markContacted",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.markContacted(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to mark opportunity Contacted");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark opportunity Contacted");
    }
  }
);

export const markQualifiedThunk = createAsyncThunk(
  "opportunity/markQualified",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.markQualified(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to mark opportunity Qualified");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark opportunity Qualified");
    }
  }
);

export const markRequirementGatheringThunk = createAsyncThunk(
  "opportunity/markRequirementGathering",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.markRequirementGathering(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to mark opportunity Requirement Gathering");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark opportunity Requirement Gathering");
    }
  }
);

export const markProposalSentThunk = createAsyncThunk(
  "opportunity/markProposalSent",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.markProposalSent(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to mark opportunity Proposal Sent");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark opportunity Proposal Sent");
    }
  }
);

export const markNegotiationThunk = createAsyncThunk(
  "opportunity/markNegotiation",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.markNegotiation(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to mark opportunity Negotiation");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark opportunity Negotiation");
    }
  }
);

export const markWonThunk = createAsyncThunk(
  "opportunity/markWon",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.markWon(id);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to mark opportunity Won");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark opportunity Won");
    }
  }
);

export const markLostThunk = createAsyncThunk(
  "opportunity/markLost",
  async ({ id, lostReason }: { id: string; lostReason: string }, { rejectWithValue }) => {
    try {
      const response = await opportunityService.markLost(id, lostReason);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to mark opportunity Lost");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to mark opportunity Lost");
    }
  }
);

export const convertToQuotationThunk = createAsyncThunk(
  "opportunity/convertToQuotation",
  async ({ id, data }: { id: string; data: ConvertToQuotationData }, { rejectWithValue }) => {
    try {
      const response = await opportunityService.convertToQuotation(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to convert opportunity to quotation");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to convert opportunity to quotation");
    }
  }
);

export const getOpportunityHistoryThunk = createAsyncThunk(
  "opportunity/getHistory",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.getOpportunityHistory(id);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch history");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch history");
    }
  }
);

export const getOpportunityActivitiesThunk = createAsyncThunk(
  "opportunity/getActivities",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await opportunityService.getOpportunityActivities(id);
      if (response.success && Array.isArray(response.data)) return response.data;
      return rejectWithValue(response.message || "Failed to fetch activities");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch activities");
    }
  }
);

export const addOpportunityActivityThunk = createAsyncThunk(
  "opportunity/addActivity",
  async ({ id, data }: { id: string; data: { type?: string; notes: string; activityDate?: string } }, { rejectWithValue }) => {
    try {
      const response = await opportunityService.addOpportunityActivity(id, data);
      if (response.success && response.data) return response.data;
      return rejectWithValue(response.message || "Failed to log activity");
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to log activity");
    }
  }
);

const opportunitySlice = createSlice({
  name: "opportunity",
  initialState,
  reducers: {
    clearOpportunityError(state) {
      state.error = null;
    },
    clearOpportunitySuccessMessage(state) {
      state.successMessage = null;
    },
    clearSingleOpportunity(state) {
      state.singleOpportunity = null;
      state.history = [];
      state.activities = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOpportunityThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOpportunityThunk.fulfilled, (state, action: PayloadAction<Opportunity>) => {
        state.loading = false;
        state.opportunities = [action.payload, ...state.opportunities];
        state.successMessage = "Opportunity created successfully";
      })
      .addCase(createOpportunityThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(getAllOpportunitiesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllOpportunitiesThunk.fulfilled, (state, action: PayloadAction<{ data: Opportunity[]; totalCount: number }>) => {
        state.loading = false;
        state.opportunities = action.payload.data;
        state.totalCount = action.payload.totalCount;
      })
      .addCase(getAllOpportunitiesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.opportunities = [];
      })
      .addCase(getOpportunityByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOpportunityByIdThunk.fulfilled, (state, action: PayloadAction<Opportunity>) => {
        state.loading = false;
        state.singleOpportunity = action.payload;
      })
      .addCase(getOpportunityByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteOpportunityThunk.fulfilled, (state, action: PayloadAction<string>) => {
        state.opportunities = state.opportunities.filter((o) => o._id !== action.payload);
        state.successMessage = "Opportunity deleted successfully";
      })
      .addCase(deleteOpportunityThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(getOpportunityHistoryThunk.fulfilled, (state, action: PayloadAction<OpportunityHistoryEntry[]>) => {
        state.history = action.payload;
      })
      .addCase(getOpportunityActivitiesThunk.fulfilled, (state, action: PayloadAction<OpportunityActivity[]>) => {
        state.activities = action.payload;
      })
      .addCase(addOpportunityActivityThunk.fulfilled, (state, action: PayloadAction<OpportunityActivity>) => {
        state.activities = [action.payload, ...state.activities];
        state.successMessage = "Activity logged successfully";
      })
      .addCase(addOpportunityActivityThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // The stage-transition thunks (contact/qualify/gather-requirements/
      // send-proposal/negotiate/win/lose), convertToQuotationThunk, and
      // updateOpportunityThunk all share the same shape: pending ->
      // loading, fulfilled -> replace singleOpportunity + toast, rejected
      // -> error.
      .addMatcher(
        isAnyOf(
          updateOpportunityThunk.pending,
          markContactedThunk.pending,
          markQualifiedThunk.pending,
          markRequirementGatheringThunk.pending,
          markProposalSentThunk.pending,
          markNegotiationThunk.pending,
          markWonThunk.pending,
          markLostThunk.pending,
          convertToQuotationThunk.pending
        ),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        isAnyOf(
          updateOpportunityThunk.fulfilled,
          markContactedThunk.fulfilled,
          markQualifiedThunk.fulfilled,
          markRequirementGatheringThunk.fulfilled,
          markProposalSentThunk.fulfilled,
          markNegotiationThunk.fulfilled,
          markWonThunk.fulfilled,
          markLostThunk.fulfilled,
          convertToQuotationThunk.fulfilled
        ),
        (state, action: PayloadAction<Opportunity>) => {
          state.loading = false;
          state.singleOpportunity = action.payload;
          const index = state.opportunities.findIndex((o) => o._id === action.payload._id);
          if (index !== -1) state.opportunities[index] = action.payload;
          state.successMessage = "Opportunity updated successfully";
        }
      )
      .addMatcher(
        isAnyOf(
          updateOpportunityThunk.rejected,
          markContactedThunk.rejected,
          markQualifiedThunk.rejected,
          markRequirementGatheringThunk.rejected,
          markProposalSentThunk.rejected,
          markNegotiationThunk.rejected,
          markWonThunk.rejected,
          markLostThunk.rejected,
          convertToQuotationThunk.rejected
        ),
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export const { clearOpportunityError, clearOpportunitySuccessMessage, clearSingleOpportunity } = opportunitySlice.actions;
export default opportunitySlice.reducer;
