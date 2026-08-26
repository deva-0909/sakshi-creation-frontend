import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

// Full Figma slide scan Phase 8 (Theme 7, Slides 74-75): Godown's
// box/cartoon receiving manifest -- a receiving record, not a material
// movement (see godownBoxReceipt.controller.js for why it's its own table
// rather than an `inventories` category).
export interface GodownBoxReceipt {
  _id: string;
  boxLabel: string;
  boxType?: string | null;
  size?: string | null;
  qty?: number | null;
  gsm?: number | null;
  dateOfOrder?: string | null;
  order?: { _id: string; orderNumber?: string } | null;
  receivedDate?: string | null;
  receivedPcs?: number | null;
  vendor?: { _id: string; name?: string } | null;
  type: "inward" | "outward";
  companyName?: { _id: string; companyName: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGodownBoxReceiptData {
  boxLabel: string;
  boxType?: string;
  size?: string;
  qty?: number | string;
  gsm?: number | string;
  dateOfOrder?: string;
  order?: string;
  receivedDate?: string;
  receivedPcs?: number | string;
  vendor?: string;
  type?: "inward" | "outward";
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

export const godownBoxReceiptService = {
  async createGodownBoxReceipt(data: CreateGodownBoxReceiptData): Promise<ApiResponse<GodownBoxReceipt>> {
    try {
      const response: AxiosResponse<ApiResponse<GodownBoxReceipt>> = await axios.post(Endpoint.CREATE_GODOWN_BOX_RECEIPT, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create box/cartoon receipt");
    }
  },

  async getAllGodownBoxReceipts(params?: { type?: "inward" | "outward"; companyName?: string }): Promise<ApiResponse<GodownBoxReceipt[]>> {
    try {
      const response: AxiosResponse<ApiResponse<GodownBoxReceipt[]>> = await axios.get(Endpoint.GET_ALL_GODOWN_BOX_RECEIPTS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch box/cartoon receipts");
    }
  },

  async updateGodownBoxReceipt(id: string, data: Partial<CreateGodownBoxReceiptData>): Promise<ApiResponse<GodownBoxReceipt>> {
    try {
      const response: AxiosResponse<ApiResponse<GodownBoxReceipt>> = await axios.patch(`${Endpoint.UPDATE_GODOWN_BOX_RECEIPT}/${id}`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update box/cartoon receipt");
    }
  },

  async deleteGodownBoxReceipt(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_GODOWN_BOX_RECEIPT}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete box/cartoon receipt");
    }
  },
};
