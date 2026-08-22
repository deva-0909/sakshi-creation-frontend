import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Designation {
  _id: string;
  designationName: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDesignationData {
  designationName: string;
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

export const designationService = {
  async createDesignation(data: CreateDesignationData): Promise<ApiResponse<Designation>> {
    try {
      const response: AxiosResponse<ApiResponse<Designation>> = await axios.post(Endpoint.CREATE_DESIGNATION, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create designation");
    }
  },

  async getAllDesignations(params?: { status?: string; search?: string }): Promise<ApiResponse<Designation[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Designation[]>> = await axios.get(Endpoint.GET_ALL_DESIGNATIONS, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch designations");
    }
  },

  async updateDesignation(id: string, data: Partial<CreateDesignationData>): Promise<ApiResponse<Designation>> {
    try {
      const response: AxiosResponse<ApiResponse<Designation>> = await axios.patch(`${Endpoint.UPDATE_DESIGNATION}/${id}`, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update designation");
    }
  },

  async deleteDesignation(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_DESIGNATION}/${id}`, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete designation");
    }
  },
};
