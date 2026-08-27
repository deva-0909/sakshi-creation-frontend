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
  material: { _id: string; materialName: string; materialSize?: string; materialGSM?: number; reorderLevel?: number | null };
  balance: number;
  // Build 5 (Quality Manager Dashboard, sub-item 3 -- low-stock alert):
  // true when this material has a reorderLevel set and its current
  // balance is below it. Materials with no reorderLevel set are never
  // flagged (backend leaves this false for them).
  belowReorder?: boolean;
}

// Module 11: On Hand vs Available -- available narrows on-hand by active
// Stock Reservations only (see stockMovement.controller.js).
export interface StockAvailability {
  materialId: string;
  onHand: number;
  reserved: number;
  available: number;
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

  async getAvailability(materialId: string, params?: { category?: string; warehouse?: string; companyName?: string }): Promise<ApiResponse<StockAvailability>> {
    try {
      const response: AxiosResponse<ApiResponse<StockAvailability>> = await axios.get(
        `${Endpoint.GET_STOCK_AVAILABILITY}/${materialId}`,
        { headers: authHeaders(), params, withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch stock availability");
    }
  },
};
