import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface DebitNote {
  _id: string;
  debitNoteNumber: string;
  amount: number;
  reason?: string;
  status: "Draft" | "Issued" | "Cancelled";
  createdAt?: string;
  issuedAt?: string;
  vendor?: { _id: string; name: string };
  purchaseOrder?: { _id: string; poNumber: string; status: string };
  companyName?: { _id: string; companyName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
}

interface CreateDebitNoteData {
  vendorId: string;
  purchaseOrderId?: string;
  companyName: string;
  amount: number;
  reason?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  pagination?: { currentPage: number; totalPages: number; totalCount: number; hasNext: boolean; hasPrev: boolean };
}

const authHeaders = () => {
  const token = authService.getToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

export const debitNoteService = {
  async createDebitNote(data: CreateDebitNoteData): Promise<ApiResponse<DebitNote>> {
    try {
      const response: AxiosResponse<ApiResponse<DebitNote>> = await axios.post(Endpoint.CREATE_DEBIT_NOTE, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create debit note");
    }
  },

  async issueDebitNote(id: string): Promise<ApiResponse<DebitNote>> {
    try {
      const response: AxiosResponse<ApiResponse<DebitNote>> = await axios.patch(
        `${Endpoint.ISSUE_DEBIT_NOTE}/${id}/issue`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to issue debit note");
    }
  },

  async cancelDebitNote(id: string): Promise<ApiResponse<DebitNote>> {
    try {
      const response: AxiosResponse<ApiResponse<DebitNote>> = await axios.patch(
        `${Endpoint.CANCEL_DEBIT_NOTE}/${id}/cancel`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to cancel debit note");
    }
  },

  async getAllDebitNotes(params?: { vendorId?: string; purchaseOrderId?: string; status?: string; search?: string; companyName?: string }): Promise<ApiResponse<DebitNote[]>> {
    try {
      const response: AxiosResponse<ApiResponse<DebitNote[]>> = await axios.get(Endpoint.GET_ALL_DEBIT_NOTES, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch debit notes");
    }
  },
};
