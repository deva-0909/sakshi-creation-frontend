import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface NumberingConfig {
  _id: string;
  docType: string;
  label: string;
  prefix?: string | null;
  separator: string;
  includeInitials: boolean;
  paddingWidth?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateNumberingConfigData {
  prefix?: string | null;
  separator?: string;
  includeInitials?: boolean;
  paddingWidth?: number | null;
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

export const numberingConfigService = {
  async getAllNumberingConfigs(): Promise<ApiResponse<NumberingConfig[]>> {
    try {
      const response: AxiosResponse<ApiResponse<NumberingConfig[]>> = await axios.get(Endpoint.GET_ALL_NUMBERING_CONFIGS, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch numbering configs");
    }
  },

  async updateNumberingConfig(id: string, data: UpdateNumberingConfigData): Promise<ApiResponse<NumberingConfig>> {
    try {
      const response: AxiosResponse<ApiResponse<NumberingConfig>> = await axios.patch(`${Endpoint.UPDATE_NUMBERING_CONFIG}/${id}`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update numbering config");
    }
  },
};
