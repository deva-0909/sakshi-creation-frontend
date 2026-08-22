import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface AppSetting {
  _id: string;
  settingKey: string;
  settingValue: string | null;
  description?: string;
  updatedAt?: string;
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

export const appSettingsService = {
  async getAllSettings(): Promise<ApiResponse<AppSetting[]>> {
    try {
      const response: AxiosResponse<ApiResponse<AppSetting[]>> = await axios.get(Endpoint.GET_APP_SETTINGS, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch settings");
    }
  },

  async updateSettingsBulk(settings: Record<string, string | number | null>): Promise<ApiResponse<AppSetting[]>> {
    try {
      const response: AxiosResponse<ApiResponse<AppSetting[]>> = await axios.patch(
        Endpoint.BULK_UPDATE_APP_SETTINGS,
        { settings },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update settings");
    }
  },
};
