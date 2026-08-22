// Module 8: a structured, approval-gated rework record -- a real replacement
// for the free-text note that used to be buried in the Designer stage's
// remarks. Mirrors the transition-style pattern already used for
// quotation/purchase order (create -> start -> submit -> approve/reject).
import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";
import { JobCardRework } from "./jobCard.service";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface CreateReworkData {
  jobCardStageId?: string;
  reason: string;
  defectCategory?: string;
  quantity?: number;
  responsibleDepartment?: string;
  responsibleStaff?: string;
  additionalMaterialNotes?: string;
  cost?: number;
}

const authHeaders = () => {
  const token = authService.getToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

export const jobCardReworkService = {
  async createRework(jobCardId: string, data: CreateReworkData): Promise<ApiResponse<JobCardRework>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCardRework>> = await axios.post(
        `${Endpoint.CREATE_JOB_CARD_REWORK}/${jobCardId}/reworks`,
        data,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create rework record");
    }
  },

  async getReworksForJobCard(jobCardId: string): Promise<ApiResponse<JobCardRework[]>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCardRework[]>> = await axios.get(
        `${Endpoint.GET_JOB_CARD_REWORKS}/${jobCardId}/reworks`,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch rework records");
    }
  },

  async startRework(jobCardId: string, reworkId: string): Promise<ApiResponse<JobCardRework>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCardRework>> = await axios.patch(
        `${Endpoint.START_JOB_CARD_REWORK}/${jobCardId}/reworks/${reworkId}/start`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to start rework");
    }
  },

  async submitReworkForApproval(jobCardId: string, reworkId: string): Promise<ApiResponse<JobCardRework>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCardRework>> = await axios.patch(
        `${Endpoint.SUBMIT_JOB_CARD_REWORK}/${jobCardId}/reworks/${reworkId}/submit`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to submit rework for approval");
    }
  },

  async approveRework(jobCardId: string, reworkId: string): Promise<ApiResponse<JobCardRework>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCardRework>> = await axios.patch(
        `${Endpoint.APPROVE_JOB_CARD_REWORK}/${jobCardId}/reworks/${reworkId}/approve`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to approve rework");
    }
  },

  async rejectRework(jobCardId: string, reworkId: string, remarks: string): Promise<ApiResponse<JobCardRework>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCardRework>> = await axios.patch(
        `${Endpoint.REJECT_JOB_CARD_REWORK}/${jobCardId}/reworks/${reworkId}/reject`,
        { remarks },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to reject rework");
    }
  },
};
