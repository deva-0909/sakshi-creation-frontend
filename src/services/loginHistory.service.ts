import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface LoginHistoryEntry {
  id: string;
  staffId: { id: string; firstName?: string; lastName?: string; email?: string } | null;
  attemptedEmail: string;
  loginAt: string;
  success: boolean;
  failureReason?: string | null;
  ipAddress?: string | null;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: Pagination;
}

const authHeaders = () => {
  const token = authService.getToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

export const loginHistoryService = {
  async getLoginHistory(params?: { staffId?: string; success?: boolean; page?: number; limit?: number }): Promise<ApiResponse<LoginHistoryEntry[]>> {
    try {
      const response: AxiosResponse<ApiResponse<LoginHistoryEntry[]>> = await axios.get(Endpoint.GET_LOGIN_HISTORY, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch login history");
    }
  },
};
