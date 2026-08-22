import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface CreditNote {
  _id: string;
  creditNoteNumber: string;
  amount: number;
  reason?: string;
  status: "Draft" | "Issued" | "Cancelled";
  createdAt?: string;
  issuedAt?: string;
  invoice?: { _id: string; invoiceNumber: string; status: string; grandTotal: number; amountPaid: number };
  party?: { _id: string; partyName: string };
  companyName?: { _id: string; companyName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
}

interface CreateCreditNoteData {
  invoiceId: string;
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

export const creditNoteService = {
  async createCreditNote(data: CreateCreditNoteData): Promise<ApiResponse<CreditNote>> {
    try {
      const response: AxiosResponse<ApiResponse<CreditNote>> = await axios.post(Endpoint.CREATE_CREDIT_NOTE, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create credit note");
    }
  },

  async issueCreditNote(id: string): Promise<ApiResponse<CreditNote>> {
    try {
      const response: AxiosResponse<ApiResponse<CreditNote>> = await axios.patch(
        `${Endpoint.ISSUE_CREDIT_NOTE}/${id}/issue`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to issue credit note");
    }
  },

  async cancelCreditNote(id: string): Promise<ApiResponse<CreditNote>> {
    try {
      const response: AxiosResponse<ApiResponse<CreditNote>> = await axios.patch(
        `${Endpoint.CANCEL_CREDIT_NOTE}/${id}/cancel`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to cancel credit note");
    }
  },

  async getAllCreditNotes(params?: { invoiceId?: string; partyId?: string; status?: string; search?: string }): Promise<ApiResponse<CreditNote[]>> {
    try {
      const response: AxiosResponse<ApiResponse<CreditNote[]>> = await axios.get(Endpoint.GET_ALL_CREDIT_NOTES, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch credit notes");
    }
  },
};
