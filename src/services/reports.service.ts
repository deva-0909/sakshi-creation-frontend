import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

// Module 14: Reporting Depth. All 4 reports are read-only, computed live
// on the backend from existing tables -- same "no second, driftable
// source of truth" philosophy as the Stock/Customer/Vendor Ledgers.

export interface DelayedJobRow {
  id: string;
  orderNumber: string;
  qty: number;
  status: string;
  expectedDeliveryDate: string;
  createdAt: string;
  party?: { _id: string; partyName: string };
  companyName?: { _id: string; companyName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  quantityDelivered: number;
  quantityRemaining: number;
  daysOverdue: number;
}

export interface CustomerPerformanceRow {
  party: { _id: string; partyName: string };
  orderCount: number;
  totalQty: number;
  revenue: number;
  onTimeDeliveryRatePct: number | null;
}

export interface SalespersonPerformanceRow {
  staff: { _id: string; firstName: string; lastName: string };
  orderCount: number;
  totalQty: number;
  revenue: number;
  distinctCustomers: number;
}

export interface PurchaseRateTrendRow {
  materialId: string;
  rate: number;
  date: string;
  source: "purchase" | "purchase_order" | "grn";
  material?: { _id: string; materialName: string } | null;
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

export const reportsService = {
  // Mobile/toggle/seed audit (2026-08-26), Phase C: companyName filters
  // this report to one company's orders/revenue; omitted keeps today's
  // behavior (both companies mixed).
  async getDelayedJobs(params?: { companyName?: string }): Promise<ApiResponse<DelayedJobRow[]>> {
    try {
      const response: AxiosResponse<ApiResponse<DelayedJobRow[]>> = await axios.get(Endpoint.GET_DELAYED_JOBS, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch delayed jobs");
    }
  },

  async getCustomerPerformance(params?: { companyName?: string }): Promise<ApiResponse<CustomerPerformanceRow[]>> {
    try {
      const response: AxiosResponse<ApiResponse<CustomerPerformanceRow[]>> = await axios.get(Endpoint.GET_CUSTOMER_PERFORMANCE, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch customer performance");
    }
  },

  async getSalespersonPerformance(params?: { companyName?: string }): Promise<ApiResponse<SalespersonPerformanceRow[]>> {
    try {
      const response: AxiosResponse<ApiResponse<SalespersonPerformanceRow[]>> = await axios.get(Endpoint.GET_SALESPERSON_PERFORMANCE, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch salesperson performance");
    }
  },

  async getPurchaseRateTrend(materialId?: string): Promise<ApiResponse<PurchaseRateTrendRow[]>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseRateTrendRow[]>> = await axios.get(Endpoint.GET_PURCHASE_RATE_TREND, {
        headers: authHeaders(),
        params: materialId ? { materialId } : undefined,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch purchase rate trend");
    }
  },
};
