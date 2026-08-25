import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

// Two-company Phase 2 Part A (claude/two-company-gap-analysis.md): Quality
// Packaging's die-cutting tooling register, from the Figma reference's
// "Dye / Punch" inventory tab.
export interface DyePunch {
  _id: string;
  dyePunchNumber: string;
  type: string;
  size?: string;
  ply?: string;
  sheetSize?: string;
  boxSize?: string;
  remarks?: string;
  party?: { _id: string; partyName: string } | null;
  // Absent/null means visible to every company, same convention as
  // product_items (Phase 1).
  companyName?: { _id: string; companyName: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDyePunchData {
  dyePunchNumber: string;
  type?: string;
  party?: string;
  size?: string;
  ply?: string;
  sheetSize?: string;
  boxSize?: string;
  remarks?: string;
  companyName?: string;
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

export const dyePunchService = {
  async createDyePunch(data: CreateDyePunchData): Promise<ApiResponse<DyePunch>> {
    try {
      const response: AxiosResponse<ApiResponse<DyePunch>> = await axios.post(Endpoint.CREATE_DYE_PUNCH, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create dye/punch");
    }
  },

  async getAllDyePunches(params?: { companyName?: string; search?: string }): Promise<ApiResponse<DyePunch[]>> {
    try {
      const response: AxiosResponse<ApiResponse<DyePunch[]>> = await axios.get(Endpoint.GET_ALL_DYE_PUNCHES, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch dye/punches");
    }
  },

  async updateDyePunch(id: string, data: Partial<CreateDyePunchData>): Promise<ApiResponse<DyePunch>> {
    try {
      const response: AxiosResponse<ApiResponse<DyePunch>> = await axios.patch(`${Endpoint.UPDATE_DYE_PUNCH}/${id}`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update dye/punch");
    }
  },

  async deleteDyePunch(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_DYE_PUNCH}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete dye/punch");
    }
  },
};
