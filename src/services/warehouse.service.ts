import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Warehouse {
  _id: string;
  warehouseName: string;
  warehouseCode?: string;
  companyName?: { _id: string; companyName: string };
  address?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateWarehouseData {
  warehouseName: string;
  warehouseCode?: string;
  companyName?: string;
  address?: string;
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

export const warehouseService = {
  async createWarehouse(data: CreateWarehouseData): Promise<ApiResponse<Warehouse>> {
    try {
      const response: AxiosResponse<ApiResponse<Warehouse>> = await axios.post(Endpoint.CREATE_WAREHOUSE, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create warehouse");
    }
  },

  async getAllWarehouses(params?: { status?: string; companyName?: string; search?: string }): Promise<ApiResponse<Warehouse[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Warehouse[]>> = await axios.get(Endpoint.GET_ALL_WAREHOUSES, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch warehouses");
    }
  },

  async updateWarehouse(id: string, data: Partial<CreateWarehouseData>): Promise<ApiResponse<Warehouse>> {
    try {
      const response: AxiosResponse<ApiResponse<Warehouse>> = await axios.patch(`${Endpoint.UPDATE_WAREHOUSE}/${id}`, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update warehouse");
    }
  },

  async deleteWarehouse(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_WAREHOUSE}/${id}`, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete warehouse");
    }
  },
};
