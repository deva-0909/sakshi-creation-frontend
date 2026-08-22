import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface LedgerRow {
  _id: string;
  category: string;
  type: "inward" | "outward";
  quantity: number;
  date: string;
  createdAt?: string;
  runningBalance: number;
}

export interface MaterialLedger {
  openingBalance: number;
  closingBalance: number;
  rows: LedgerRow[];
}

export interface StockSummaryEntry {
  material: { _id: string; materialName: string; materialSize?: string; materialGSM?: number };
  balance: number;
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

export const stockLedgerService = {
  async getMaterialLedger(
    materialId: string,
    params?: { category?: string; from?: string; to?: string; companyName?: string }
  ): Promise<ApiResponse<MaterialLedger>> {
    try {
      const response: AxiosResponse<ApiResponse<MaterialLedger>> = await axios.get(
        `${Endpoint.GET_MATERIAL_LEDGER}/${materialId}`,
        { headers: authHeaders(), params, withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch material ledger");
    }
  },

  async getSummary(params?: { category?: string; companyName?: string }): Promise<ApiResponse<StockSummaryEntry[]>> {
    try {
      const response: AxiosResponse<ApiResponse<StockSummaryEntry[]>> = await axios.get(Endpoint.GET_STOCK_SUMMARY, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch stock summary");
    }
  },
};
