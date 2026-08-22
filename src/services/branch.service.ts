import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Branch {
  _id: string;
  branchName: string;
  companyName?: { _id: string; companyName: string };
  address?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBranchData {
  branchName: string;
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

export const branchService = {
  async createBranch(data: CreateBranchData): Promise<ApiResponse<Branch>> {
    try {
      const response: AxiosResponse<ApiResponse<Branch>> = await axios.post(Endpoint.CREATE_BRANCH, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create branch");
    }
  },

  async getAllBranches(params?: { status?: string; search?: string }): Promise<ApiResponse<Branch[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Branch[]>> = await axios.get(Endpoint.GET_ALL_BRANCHES, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch branches");
    }
  },

  async updateBranch(id: string, data: Partial<CreateBranchData>): Promise<ApiResponse<Branch>> {
    try {
      const response: AxiosResponse<ApiResponse<Branch>> = await axios.patch(`${Endpoint.UPDATE_BRANCH}/${id}`, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update branch");
    }
  },

  async deleteBranch(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_BRANCH}/${id}`, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete branch");
    }
  },
};
