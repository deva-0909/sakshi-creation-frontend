import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface RfqItem {
  _id: string;
  materialId: string;
  quantityNeeded: number;
  material?: { _id: string; materialName: string; materialSize?: string; materialGSM?: number };
}

export interface RfqVendorQuoteItem {
  _id: string;
  rate: number;
  notes?: string;
  rfqItemId: string;
}

export interface RfqVendorQuote {
  _id: string;
  status: "Invited" | "Quoted" | "Selected" | "Not Selected";
  vendor?: { _id: string; name: string };
  items?: RfqVendorQuoteItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Rfq {
  _id: string;
  rfqNumber: string;
  status: "Draft" | "Sent" | "Closed" | "Cancelled";
  notes?: string;
  companyName?: { _id: string; companyName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  items?: RfqItem[];
  quotes?: RfqVendorQuote[];
  createdAt?: string;
  updatedAt?: string;
}

interface CreateRfqData {
  companyName: string;
  notes?: string;
  items: { materialId: string; quantityNeeded: number }[];
  vendorIds: string[];
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

export const rfqService = {
  async createRfq(data: CreateRfqData): Promise<ApiResponse<Rfq>> {
    try {
      const response: AxiosResponse<ApiResponse<Rfq>> = await axios.post(Endpoint.CREATE_RFQ, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create RFQ");
    }
  },

  async getAllRfqs(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<Rfq[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Rfq[]>> = await axios.get(Endpoint.GET_ALL_RFQS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch RFQs");
    }
  },

  async getRfqById(id: string): Promise<ApiResponse<Rfq>> {
    try {
      const response: AxiosResponse<ApiResponse<Rfq>> = await axios.get(`${Endpoint.GET_RFQ_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch RFQ");
    }
  },

  async deleteRfq(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_RFQ}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete RFQ");
    }
  },

  async sendRfq(id: string): Promise<ApiResponse<Rfq>> {
    try {
      const response: AxiosResponse<ApiResponse<Rfq>> = await axios.patch(`${Endpoint.SEND_RFQ}/${id}/send`, {}, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to send RFQ");
    }
  },

  async cancelRfq(id: string): Promise<ApiResponse<Rfq>> {
    try {
      const response: AxiosResponse<ApiResponse<Rfq>> = await axios.patch(`${Endpoint.CANCEL_RFQ}/${id}/cancel`, {}, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to cancel RFQ");
    }
  },

  async recordVendorQuote(quoteId: string, items: { rfqItemId: string; rate: number; notes?: string }[]): Promise<ApiResponse<RfqVendorQuote>> {
    try {
      const response: AxiosResponse<ApiResponse<RfqVendorQuote>> = await axios.patch(
        `${Endpoint.RECORD_VENDOR_QUOTE}/${quoteId}`,
        { items },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to record vendor quote");
    }
  },
};
