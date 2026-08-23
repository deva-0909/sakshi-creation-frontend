import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Quotation {
  _id: string;
  quotationNumber: string;
  qty: number;
  size?: string;
  specs?: Record<string, any>;
  rateType?: string;
  rate?: number;
  printingrate?: number;
  isGst: boolean;
  gstPercentage?: number;
  totalAmount?: number;
  status: string;
  validUntil?: string;
  remarks?: string;
  orderId?: string;
  companyName?: { _id: string; companyName: string };
  party?: { _id: string; partyName: string };
  productItem?: { _id: string; itemName: string };
  approvedBy?: { _id: string; firstName: string; lastName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  approvedAt?: string;
  sentAt?: string;
  respondedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationHistoryEntry {
  _id: string;
  fromStatus?: string;
  toStatus: string;
  remarks?: string;
  createdAt: string;
  changedBy?: { _id: string; firstName: string; lastName: string };
}

interface CreateQuotationData {
  companyName: string;
  party: string;
  productItem: string;
  qty: number;
  size?: string;
  specs?: Record<string, any>;
  rateType?: string;
  rate?: number;
  printingrate?: number;
  isGst?: boolean;
  gstPercentage?: number;
  totalAmount?: number;
  validUntil?: string;
  remarks?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const authHeaders = () => {
  const token = authService.getToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

export const quotationService = {
  async createQuotation(data: CreateQuotationData): Promise<ApiResponse<Quotation>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation>> = await axios.post(
        Endpoint.CREATE_QUOTATION,
        data,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create quotation");
    }
  },

  async getAllQuotations(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<Quotation[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation[]>> = await axios.get(Endpoint.GET_ALL_QUOTATIONS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch quotations");
    }
  },

  async getQuotationById(id: string): Promise<ApiResponse<Quotation>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation>> = await axios.get(`${Endpoint.GET_QUOTATION_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch quotation");
    }
  },

  async updateQuotation(id: string, data: Partial<CreateQuotationData>): Promise<ApiResponse<Quotation>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation>> = await axios.patch(`${Endpoint.UPDATE_QUOTATION}/${id}`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update quotation");
    }
  },

  async deleteQuotation(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_QUOTATION}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete quotation");
    }
  },

  async submitForApproval(id: string): Promise<ApiResponse<Quotation>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation>> = await axios.patch(
        `${Endpoint.SUBMIT_QUOTATION_FOR_APPROVAL}/${id}/submit-for-approval`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to submit quotation for approval");
    }
  },

  async approveQuotation(id: string): Promise<ApiResponse<Quotation>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation>> = await axios.patch(
        `${Endpoint.APPROVE_QUOTATION}/${id}/approve`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to approve quotation");
    }
  },

  async rejectQuotation(id: string, remarks: string): Promise<ApiResponse<Quotation>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation>> = await axios.patch(
        `${Endpoint.REJECT_QUOTATION}/${id}/reject`,
        { remarks },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to reject quotation");
    }
  },

  async sendQuotation(id: string): Promise<ApiResponse<Quotation>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation>> = await axios.patch(
        `${Endpoint.SEND_QUOTATION}/${id}/send`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to send quotation");
    }
  },

  async respondQuotation(id: string, response_: "Accepted" | "Rejected", remarks?: string): Promise<ApiResponse<Quotation>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation>> = await axios.patch(
        `${Endpoint.RESPOND_QUOTATION}/${id}/respond`,
        { response: response_, remarks },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to record quotation response");
    }
  },

  async convertQuotation(id: string): Promise<ApiResponse<Quotation>> {
    try {
      const response: AxiosResponse<ApiResponse<Quotation>> = await axios.post(
        `${Endpoint.CONVERT_QUOTATION}/${id}/convert`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to convert quotation to order");
    }
  },

  async getQuotationHistory(id: string): Promise<ApiResponse<QuotationHistoryEntry[]>> {
    try {
      const response: AxiosResponse<ApiResponse<QuotationHistoryEntry[]>> = await axios.get(
        `${Endpoint.GET_QUOTATION_HISTORY}/${id}/history`,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch quotation history");
    }
  },

  async getQuotationPdf(id: string): Promise<Blob> {
    try {
      const response = await axios.get(`${Endpoint.GET_QUOTATION_PDF}/${id}/pdf`, {
        headers: authHeaders(),
        withCredentials: true,
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to generate quotation PDF");
    }
  },
};
