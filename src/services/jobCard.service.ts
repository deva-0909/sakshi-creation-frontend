import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface JobCard {
  _id: string;
  jobCardNumber: string;
  qty: number;
  priority: string;
  dueDate?: string;
  status: string;
  currentStage: string;
  order?: { _id: string; orderNumber: string };
  productItem?: { _id: string; itemName: string };
  assignedTo?: { _id: string; firstName: string; lastName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface JobCardStage {
  _id: string;
  stage: string;
  status: string;
  assignedTo?: { _id: string; firstName: string; lastName: string };
  remarks?: string;
  wastedSheet?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
}

export interface MaterialUsage {
  _id: string;
  quantityUsed: number;
  createdAt: string;
  material?: { _id: string; materialName: string };
  inventoryId?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const authHeaders = () => {
  const token = authService.getToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

export const jobCardService = {
  async createJobCard(orderId: string, data: { priority?: string; dueDate?: string }): Promise<ApiResponse<JobCard>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCard>> = await axios.post(
        `${Endpoint.CREATE_JOB_CARD}/${orderId}`,
        data,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create job card");
    }
  },

  async getAllJobCards(params?: { status?: string; priority?: string; assignedTo?: string; page?: number; limit?: number }): Promise<ApiResponse<JobCard[]>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCard[]>> = await axios.get(Endpoint.GET_ALL_JOB_CARDS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch job cards");
    }
  },

  async getJobCardById(id: string): Promise<ApiResponse<JobCard>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCard>> = await axios.get(`${Endpoint.GET_JOB_CARD_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch job card");
    }
  },

  async updateJobCard(id: string, data: { priority?: string; dueDate?: string; assignedTo?: string; status?: string }): Promise<ApiResponse<JobCard>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCard>> = await axios.patch(`${Endpoint.UPDATE_JOB_CARD}/${id}`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update job card");
    }
  },

  async deleteJobCard(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_JOB_CARD}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete job card");
    }
  },

  async advanceStage(
    id: string,
    data: { stage: string; assignedTo?: string; status: string; remarks?: string; wastedSheet?: number }
  ): Promise<ApiResponse<{ jobCard: JobCard; stage: JobCardStage }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ jobCard: JobCard; stage: JobCardStage }>> = await axios.patch(
        `${Endpoint.ADVANCE_JOB_CARD_STAGE}/${id}/stage`,
        data,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to advance job card stage");
    }
  },

  async getStageHistory(id: string): Promise<ApiResponse<JobCardStage[]>> {
    try {
      const response: AxiosResponse<ApiResponse<JobCardStage[]>> = await axios.get(
        `${Endpoint.GET_JOB_CARD_STAGE_HISTORY}/${id}/stage-history`,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch stage history");
    }
  },

  async recordMaterialUsage(
    id: string,
    data: { jobCardStageId?: string; material: string; bom?: string; quantityUsed: number; forRole: string; forCompany: string }
  ): Promise<ApiResponse<MaterialUsage>> {
    try {
      const response: AxiosResponse<ApiResponse<MaterialUsage>> = await axios.post(
        `${Endpoint.RECORD_JOB_CARD_MATERIAL_USAGE}/${id}/material-usage`,
        data,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to record material usage");
    }
  },
};
