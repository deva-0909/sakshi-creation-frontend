import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Uom {
  _id: string;
  name: string;
  symbol?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUomData {
  name: string;
  symbol?: string;
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

export const uomService = {
  async createUom(data: CreateUomData): Promise<ApiResponse<Uom>> {
    try {
      const response: AxiosResponse<ApiResponse<Uom>> = await axios.post(Endpoint.CREATE_UOM, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create unit of measure");
    }
  },

  async getAllUoms(params?: { status?: string; search?: string }): Promise<ApiResponse<Uom[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Uom[]>> = await axios.get(Endpoint.GET_ALL_UOM, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch units of measure");
    }
  },

  async updateUom(id: string, data: Partial<CreateUomData>): Promise<ApiResponse<Uom>> {
    try {
      const response: AxiosResponse<ApiResponse<Uom>> = await axios.patch(`${Endpoint.UPDATE_UOM}/${id}`, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update unit of measure");
    }
  },

  async deleteUom(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_UOM}/${id}`, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete unit of measure");
    }
  },
};
