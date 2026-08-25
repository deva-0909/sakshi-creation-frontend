import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface InvoiceItem {
  _id: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  taxableAmount: number;
  lineTotal: number;
}

export interface InvoiceHistoryEntry {
  _id: string;
  fromStatus?: string;
  toStatus: string;
  remarks?: string;
  createdAt: string;
  changedBy?: { _id: string; firstName: string; lastName: string };
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  gstType: "CGST_SGST" | "IGST" | "None";
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  amountPaid: number;
  status: "Draft" | "Issued" | "Partially Paid" | "Paid" | "Cancelled";
  notes?: string;
  orderId?: string;
  quotationId?: string;
  companyName?: { _id: string; companyName: string };
  party?: { _id: string; partyName: string; gstNo?: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  items?: InvoiceItem[];
  createdAt?: string;
  updatedAt?: string;
}

interface CreateInvoiceData {
  companyName: string;
  partyId: string;
  orderId?: string;
  quotationId?: string;
  invoiceDate: string;
  dueDate?: string;
  notes?: string;
  items: { description: string; hsnCode?: string; quantity: number; unitPrice: number; gstRate: number }[];
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

export const invoiceService = {
  async createInvoice(data: CreateInvoiceData): Promise<ApiResponse<Invoice>> {
    try {
      const response: AxiosResponse<ApiResponse<Invoice>> = await axios.post(Endpoint.CREATE_INVOICE, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create invoice");
    }
  },

  async getAllInvoices(params?: { status?: string; partyId?: string; companyName?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<Invoice[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Invoice[]>> = await axios.get(Endpoint.GET_ALL_INVOICES, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch invoices");
    }
  },

  async getInvoiceById(id: string): Promise<ApiResponse<Invoice>> {
    try {
      const response: AxiosResponse<ApiResponse<Invoice>> = await axios.get(`${Endpoint.GET_INVOICE_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch invoice");
    }
  },

  async deleteInvoice(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_INVOICE}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete invoice");
    }
  },

  async issueInvoice(id: string): Promise<ApiResponse<Invoice>> {
    try {
      const response: AxiosResponse<ApiResponse<Invoice>> = await axios.patch(`${Endpoint.ISSUE_INVOICE}/${id}/issue`, {}, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to issue invoice");
    }
  },

  async cancelInvoice(id: string, remarks: string): Promise<ApiResponse<Invoice>> {
    try {
      const response: AxiosResponse<ApiResponse<Invoice>> = await axios.patch(
        `${Endpoint.CANCEL_INVOICE}/${id}/cancel`,
        { remarks },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to cancel invoice");
    }
  },

  async getInvoiceHistory(id: string): Promise<ApiResponse<InvoiceHistoryEntry[]>> {
    try {
      const response: AxiosResponse<ApiResponse<InvoiceHistoryEntry[]>> = await axios.get(`${Endpoint.GET_INVOICE_HISTORY}/${id}/history`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch invoice history");
    }
  },

  async getInvoicePdf(id: string): Promise<Blob> {
    try {
      const response = await axios.get(`${Endpoint.GET_INVOICE_PDF}/${id}/pdf`, {
        headers: authHeaders(),
        withCredentials: true,
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to generate invoice PDF");
    }
  },
};
