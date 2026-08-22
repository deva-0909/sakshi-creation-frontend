import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface CostingMaterialLine {
  material: { _id: string; materialName: string };
  quantityUsed: number;
  rate: number | null;
  lineCost: number | null;
}

export interface Costing {
  id: string;
  _id: string;
  jobCardNumber: string;
  qty: number;
  status: string;
  createdAt: string;
  order?: { _id: string; orderNumber: string };
  materialCost: number;
  hasFullMaterialRateData: boolean;
  laborCost: number;
  overheadCost: number;
  totalCost: number;
  revenue: number;
  profit: number;
  marginPct: number | null;
  notes?: string | null;
  materialLines?: CostingMaterialLine[];
}

interface UpsertLaborCostData {
  laborCost?: number;
  overheadCost?: number;
  notes?: string;
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

export const costingService = {
  async getAllCosting(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<Costing[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Costing[]>> = await axios.get(Endpoint.GET_ALL_COSTING, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch costing summary");
    }
  },

  async getCostingByJobCard(jobCardId: string): Promise<ApiResponse<Costing>> {
    try {
      const response: AxiosResponse<ApiResponse<Costing>> = await axios.get(`${Endpoint.GET_COSTING_BY_JOB_CARD}/${jobCardId}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch job card costing");
    }
  },

  async upsertLaborCost(jobCardId: string, data: UpsertLaborCostData): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await axios.put(`${Endpoint.UPSERT_LABOR_COST}/${jobCardId}/labor`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to save labor/overhead cost");
    }
  },
};
