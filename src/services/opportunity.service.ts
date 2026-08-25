import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Opportunity {
  _id: string;
  opportunityNumber: string;
  prospectName: string;
  contactPerson?: string;
  contactPhone: string;
  contactEmail?: string;
  estimatedValue?: number;
  source?: string;
  stage: string;
  notes?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  partyId?: string;
  followUpDate?: string;
  quotationId?: string;
  companyName?: { _id: string; companyName: string };
  assignedTo?: { _id: string; firstName: string; lastName: string };
  party?: { _id: string; partyName: string };
  quotation?: { _id: string; quotationNumber: string; status: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface OpportunityHistoryEntry {
  _id: string;
  fromStage?: string;
  toStage: string;
  remarks?: string;
  createdAt: string;
  changedBy?: { _id: string; firstName: string; lastName: string };
}

export interface OpportunityActivity {
  _id: string;
  type: string;
  notes?: string;
  activityDate: string;
  createdAt: string;
  createdBy?: { _id: string; firstName: string; lastName: string };
}

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

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  pagination?: { currentPage: number; totalPages: number; totalCount: number; hasNext: boolean; hasPrev: boolean };
}

const authHeaders = () => {
  const token = authService.getToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

export const opportunityService = {
  async createOpportunity(data: CreateOpportunityData): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.post(Endpoint.CREATE_OPPORTUNITY, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create opportunity");
    }
  },

  async getAllOpportunities(params?: { stage?: string; partyId?: string; assignedTo?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<Opportunity[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity[]>> = await axios.get(Endpoint.GET_ALL_OPPORTUNITIES, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch opportunities");
    }
  },

  async getOpportunityById(id: string): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.get(`${Endpoint.GET_OPPORTUNITY_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch opportunity");
    }
  },

  async updateOpportunity(id: string, data: Partial<CreateOpportunityData>): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.patch(`${Endpoint.UPDATE_OPPORTUNITY}/${id}`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update opportunity");
    }
  },

  async deleteOpportunity(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_OPPORTUNITY}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete opportunity");
    }
  },

  async markContacted(id: string): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.patch(`${Endpoint.OPPORTUNITY_CONTACT}/${id}/contact`, {}, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to mark opportunity Contacted");
    }
  },

  async markQualified(id: string): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.patch(`${Endpoint.OPPORTUNITY_QUALIFY}/${id}/qualify`, {}, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to mark opportunity Qualified");
    }
  },

  async markRequirementGathering(id: string): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.patch(
        `${Endpoint.OPPORTUNITY_GATHER_REQUIREMENTS}/${id}/gather-requirements`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to mark opportunity Requirement Gathering");
    }
  },

  async markProposalSent(id: string): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.patch(`${Endpoint.OPPORTUNITY_SEND_PROPOSAL}/${id}/send-proposal`, {}, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to mark opportunity Proposal Sent");
    }
  },

  async markNegotiation(id: string): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.patch(`${Endpoint.OPPORTUNITY_NEGOTIATE}/${id}/negotiate`, {}, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to mark opportunity Negotiation");
    }
  },

  async markWon(id: string): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.patch(`${Endpoint.OPPORTUNITY_WIN}/${id}/win`, {}, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to mark opportunity Won");
    }
  },

  async markLost(id: string, lostReason: string): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.patch(`${Endpoint.OPPORTUNITY_LOSE}/${id}/lose`, { lostReason }, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to mark opportunity Lost");
    }
  },

  async getOpportunityHistory(id: string): Promise<ApiResponse<OpportunityHistoryEntry[]>> {
    try {
      const response: AxiosResponse<ApiResponse<OpportunityHistoryEntry[]>> = await axios.get(`${Endpoint.GET_OPPORTUNITY_HISTORY}/${id}/history`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch opportunity history");
    }
  },

  async getOpportunityActivities(id: string): Promise<ApiResponse<OpportunityActivity[]>> {
    try {
      const response: AxiosResponse<ApiResponse<OpportunityActivity[]>> = await axios.get(`${Endpoint.GET_OPPORTUNITY_ACTIVITIES}/${id}/activities`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch opportunity activities");
    }
  },

  async addOpportunityActivity(id: string, data: { type?: string; notes: string; activityDate?: string }): Promise<ApiResponse<OpportunityActivity>> {
    try {
      const response: AxiosResponse<ApiResponse<OpportunityActivity>> = await axios.post(`${Endpoint.ADD_OPPORTUNITY_ACTIVITY}/${id}/activities`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to log activity");
    }
  },

  // Module 15: gated on Won (party_id set) on the backend.
  async convertToQuotation(id: string, data: ConvertToQuotationData): Promise<ApiResponse<Opportunity>> {
    try {
      const response: AxiosResponse<ApiResponse<Opportunity>> = await axios.post(`${Endpoint.OPPORTUNITY_CONVERT_TO_QUOTATION}/${id}/convert-to-quotation`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to convert opportunity to quotation");
    }
  },
};
