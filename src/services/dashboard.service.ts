import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

// Every field is optional -- dashboard.controller.js omits a widget's key
// entirely when the caller's own view permission for that module is
// false, so the frontend must treat every section as "may not be present"
// rather than assuming a fixed shape.
export interface DashboardSummary {
  quotations?: { byStatus: Record<string, number> };
  purchaseOrders?: { byStatus: Record<string, number> };
  jobCards?: { byStatus: Record<string, number> };
  invoices?: { byStatus: Record<string, number>; monthlyRevenue: number };
  pendingApprovalsCount?: number;
  lowestStockMaterials?: { material: { _id: string; materialName: string }; balance: number }[];
  profitability?: {
    jobCardCount: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    marginPct: number | null;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const authHeaders = () => {
  const token = authService.getToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

export const dashboardService = {
  async getSummary(): Promise<ApiResponse<DashboardSummary>> {
    try {
      const response: AxiosResponse<ApiResponse<DashboardSummary>> = await axios.get(Endpoint.GET_DASHBOARD_SUMMARY, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch dashboard summary");
    }
  },
};
