import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface ProcessStage {
  _id: string;
  stageName: string;
  stageOrder: number;
  description?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProcessStageData {
  stageName: string;
  stageOrder?: number;
  description?: string;
  status?: string;
}

export interface RoutingTemplateStage {
  _id: string;
  sequenceOrder: number;
  processStage: { _id: string; stageName: string; stageOrder: number };
}

export interface RoutingTemplate {
  _id: string;
  templateName: string;
  productItem?: { _id: string; itemName: string } | null;
  isDefault: boolean;
  status: string;
  stages: RoutingTemplateStage[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoutingTemplateData {
  templateName: string;
  productItemId?: string;
  isDefault?: boolean;
  stageIds: string[];
}

export interface UpdateRoutingTemplateData {
  templateName?: string;
  productItemId?: string | null;
  isDefault?: boolean;
  status?: string;
  stageIds?: string[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

const authHeaders = () => {
  const token = authService.getToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

export const routingService = {
  // -- Process Stages --
  async createProcessStage(data: CreateProcessStageData): Promise<ApiResponse<ProcessStage>> {
    try {
      const response: AxiosResponse<ApiResponse<ProcessStage>> = await axios.post(Endpoint.CREATE_PROCESS_STAGE, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create process stage");
    }
  },
  async getAllProcessStages(params?: { status?: string }): Promise<ApiResponse<ProcessStage[]>> {
    try {
      const response: AxiosResponse<ApiResponse<ProcessStage[]>> = await axios.get(Endpoint.GET_ALL_PROCESS_STAGES, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch process stages");
    }
  },
  async updateProcessStage(id: string, data: Partial<CreateProcessStageData>): Promise<ApiResponse<ProcessStage>> {
    try {
      const response: AxiosResponse<ApiResponse<ProcessStage>> = await axios.patch(`${Endpoint.UPDATE_PROCESS_STAGE}/${id}`, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update process stage");
    }
  },
  async deleteProcessStage(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_PROCESS_STAGE}/${id}`, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete process stage");
    }
  },

  // -- Routing Templates --
  async createRoutingTemplate(data: CreateRoutingTemplateData): Promise<ApiResponse<RoutingTemplate>> {
    try {
      const response: AxiosResponse<ApiResponse<RoutingTemplate>> = await axios.post(Endpoint.CREATE_ROUTING_TEMPLATE, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create routing template");
    }
  },
  async getAllRoutingTemplates(params?: { productItemId?: string; status?: string }): Promise<ApiResponse<RoutingTemplate[]>> {
    try {
      const response: AxiosResponse<ApiResponse<RoutingTemplate[]>> = await axios.get(Endpoint.GET_ALL_ROUTING_TEMPLATES, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch routing templates");
    }
  },
  async updateRoutingTemplate(id: string, data: UpdateRoutingTemplateData): Promise<ApiResponse<RoutingTemplate>> {
    try {
      const response: AxiosResponse<ApiResponse<RoutingTemplate>> = await axios.patch(`${Endpoint.UPDATE_ROUTING_TEMPLATE}/${id}`, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update routing template");
    }
  },
  async deleteRoutingTemplate(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_ROUTING_TEMPLATE}/${id}`, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete routing template");
    }
  },
  async getSuggestedRoutingTemplate(productItemId?: string): Promise<ApiResponse<RoutingTemplate | null>> {
    try {
      const response: AxiosResponse<ApiResponse<RoutingTemplate | null>> = await axios.get(Endpoint.GET_SUGGESTED_ROUTING_TEMPLATE, {
        headers: authHeaders(),
        params: productItemId ? { productItemId } : undefined,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data ?? null, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch suggested routing");
    }
  },
};
