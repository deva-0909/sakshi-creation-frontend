import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface PurchaseReturnItem {
  _id: string;
  quantityReturned: number;
  rate: number;
  grnItemId: string;
  material?: { _id: string; materialName: string };
}

export interface PurchaseReturn {
  _id: string;
  returnNumber: string;
  returnDate: string;
  reason: string;
  notes?: string;
  grn?: { _id: string; grnNumber: string };
  vendor?: { _id: string; name: string };
  companyName?: { _id: string; companyName: string };
  items?: PurchaseReturnItem[];
  createdAt?: string;
}

export interface CreatePurchaseReturnData {
  grnId: string;
  forRole: string;
  forCompany: string;
  returnDate?: string;
  reason: string;
  notes?: string;
  items: { grnItemId: string; quantityReturned: number }[];
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

export const purchaseReturnService = {
  async createPurchaseReturn(data: CreatePurchaseReturnData): Promise<ApiResponse<PurchaseReturn>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseReturn>> = await axios.post(Endpoint.CREATE_PURCHASE_RETURN, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to post purchase return");
    }
  },

  async getAllPurchaseReturns(params?: { grnId?: string }): Promise<ApiResponse<PurchaseReturn[]>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseReturn[]>> = await axios.get(Endpoint.GET_ALL_PURCHASE_RETURNS, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch purchase returns");
    }
  },
};
