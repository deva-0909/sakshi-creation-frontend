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
  // Phase 2 Part B (two-company): drives which stage set the detail page
  // offers -- Quality Packaging's job cards run Printer -> Binder ->
  // Booklet Binder -> Factory -> Godown, no Designer/QC/Delivery.
  order?: { _id: string; orderNumber: string; companyName?: { _id: string; companyName: string } | null };
  productItem?: { _id: string; itemName: string };
  assignedTo?: { _id: string; firstName: string; lastName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  createdAt?: string;
  updatedAt?: string;
}

// Module 8: fixed starter list of defect categories -- kept as a fixed list
// rather than free text so the wastage/QC reports can group meaningfully.
export const DEFECT_CATEGORIES = ["Print Misalignment", "Binding Defect", "Paper Damage", "Color Mismatch", "Other"];

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
  machine?: { _id: string; machineName: string; machineCode: string };
  // Module 8: real quantity depth + QC/rework/wastage tracking.
  completedQty?: number;
  rejectedQty?: number;
  reworkQty?: number;
  qcResult?: "Passed" | "Failed";
  defectCategory?: string;
  defectReason?: string;
  wastageReason?: string;
  wastageMaterial?: { _id: string; materialName: string };
}

export interface JobCardRework {
  _id: string;
  reason: string;
  defectCategory?: string;
  quantity?: number;
  responsibleDepartment?: string;
  responsibleStaff?: { _id: string; firstName: string; lastName: string };
  additionalMaterialNotes?: string;
  cost?: number;
  status: string;
  jobCardStage?: { _id: string; stage: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  approvedBy?: { _id: string; firstName: string; lastName: string };
  approvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WastageReportRow {
  material: { _id: string; materialName: string };
  totalWasted: number;
  entries: number;
  expectedWastagePercent: number | null;
  byStage: Record<string, number>;
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

  // companyName/currentStage added for Phase 3 Part B's Quality Manager
  // Dashboard, which needs Quality Packaging's job cards broken down by
  // pipeline stage (Factory/Godown counts, etc.) -- see jobCard.controller.js.
  async getAllJobCards(params?: { status?: string; priority?: string; assignedTo?: string; companyName?: string; currentStage?: string; page?: number; limit?: number }): Promise<ApiResponse<JobCard[]>> {
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
    data: {
      stage: string;
      assignedTo?: string;
      status: string;
      remarks?: string;
      machine?: string;
      // Module 8: real quantity depth
      completedQty?: number;
      rejectedQty?: number;
      reworkQty?: number;
      // Module 8: QC (only meaningful when stage === "QC")
      qcResult?: "Passed" | "Failed";
      defectCategory?: string;
      defectReason?: string;
      // Module 8: wastage now requires naming the material + Role/Staff
      wastedSheet?: number;
      wastageReason?: string;
      wastageMaterial?: string;
      wastageForRole?: string;
      wastageForCompany?: string;
    }
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

  async getWastageReport(params?: { from?: string; to?: string; materialId?: string; stage?: string }): Promise<ApiResponse<WastageReportRow[]>> {
    try {
      const response: AxiosResponse<ApiResponse<WastageReportRow[]>> = await axios.get(Endpoint.GET_WASTAGE_REPORT, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch wastage report");
    }
  },
};
