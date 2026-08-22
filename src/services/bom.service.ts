import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface BomLine {
  _id: string;
  quantityPerUnit: number;
  unit: string;
  notes?: string;
  // Module 8: lets the wastage report compare actual wastage against a plan.
  expectedWastagePercent?: number | null;
  productItem?: { _id: string; itemName: string };
  material?: { _id: string; materialName: string; materialSize?: string; materialGSM?: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface CostEstimateLine {
  material: { _id: string; materialName: string };
  unit: string;
  quantityPerUnit: number;
  quantityNeeded: number;
  rate: number | null;
  lineCost: number | null;
}

export interface CostEstimate {
  lines: CostEstimateLine[];
  totalCost: number | null;
  hasRecipe: boolean;
}

interface CreateBomLineData {
  productItem: string;
  material: string;
  quantityPerUnit: number;
  unit?: string;
  notes?: string;
  expectedWastagePercent?: number;
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

export const bomService = {
  async createBomLine(data: CreateBomLineData): Promise<ApiResponse<BomLine>> {
    try {
      const response: AxiosResponse<ApiResponse<BomLine>> = await axios.post(Endpoint.CREATE_BOM_LINE, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to add recipe line");
    }
  },

  async getBomForProduct(productItemId: string): Promise<ApiResponse<BomLine[]>> {
    try {
      const response: AxiosResponse<ApiResponse<BomLine[]>> = await axios.get(
        `${Endpoint.GET_BOM_FOR_PRODUCT}/${productItemId}`,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch recipe");
    }
  },

  async updateBomLine(id: string, data: Partial<CreateBomLineData>): Promise<ApiResponse<BomLine>> {
    try {
      const response: AxiosResponse<ApiResponse<BomLine>> = await axios.patch(`${Endpoint.UPDATE_BOM_LINE}/${id}`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update recipe line");
    }
  },

  async deleteBomLine(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_BOM_LINE}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to remove recipe line");
    }
  },

  async estimateCost(productItemId: string, qty: number): Promise<ApiResponse<CostEstimate>> {
    try {
      const response: AxiosResponse<ApiResponse<CostEstimate>> = await axios.get(
        `${Endpoint.ESTIMATE_BOM_COST}/${productItemId}/estimate-cost`,
        { headers: authHeaders(), params: { qty }, withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to estimate cost");
    }
  },
};
