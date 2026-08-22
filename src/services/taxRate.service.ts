import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface TaxRate {
  _id: string;
  name: string;
  ratePercent: number;
  isDefault: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTaxRateData {
  name: string;
  ratePercent: number;
  isDefault?: boolean;
  status?: string;
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

export const taxRateService = {
  async createTaxRate(data: CreateTaxRateData): Promise<ApiResponse<TaxRate>> {
    try {
      const response: AxiosResponse<ApiResponse<TaxRate>> = await axios.post(Endpoint.CREATE_TAX_RATE, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create tax rate");
    }
  },

  async getAllTaxRates(params?: { status?: string; search?: string }): Promise<ApiResponse<TaxRate[]>> {
    try {
      const response: AxiosResponse<ApiResponse<TaxRate[]>> = await axios.get(Endpoint.GET_ALL_TAX_RATES, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch tax rates");
    }
  },

  async updateTaxRate(id: string, data: Partial<CreateTaxRateData>): Promise<ApiResponse<TaxRate>> {
    try {
      const response: AxiosResponse<ApiResponse<TaxRate>> = await axios.patch(`${Endpoint.UPDATE_TAX_RATE}/${id}`, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update tax rate");
    }
  },

  async deleteTaxRate(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_TAX_RATE}/${id}`, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete tax rate");
    }
  },
};
