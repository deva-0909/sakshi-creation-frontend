import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Receipt {
  _id: string;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  mode: "Cash" | "Bank Transfer" | "UPI" | "Cheque" | "Other";
  referenceNumber?: string;
  notes?: string;
  invoice?: { _id: string; invoiceNumber: string; status: string; grandTotal: number; amountPaid: number };
  party?: { _id: string; partyName: string };
  companyName?: { _id: string; companyName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  createdAt?: string;
  // Present only on a receipt posted via allocateReceipt (Module 9) -- a
  // single-invoice receipt (createReceipt) never populates this.
  allocations?: { id: string; amountAllocated: number; invoice: { _id: string; invoiceNumber: string; status: string; grandTotal: number; amountPaid: number } }[];
}

interface CreateReceiptData {
  invoiceId?: string;
  partyId: string;
  companyName: string;
  amount: number;
  paymentDate: string;
  mode: string;
  referenceNumber?: string;
  notes?: string;
}

export interface ReceiptAllocationLine {
  invoiceId: string;
  amount: number;
}

interface CreateReceiptAllocationData {
  partyId: string;
  companyName: string;
  amount: number;
  paymentDate: string;
  mode: string;
  referenceNumber?: string;
  notes?: string;
  allocations: ReceiptAllocationLine[];
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

export const receiptService = {
  async createReceipt(data: CreateReceiptData): Promise<ApiResponse<Receipt>> {
    try {
      const response: AxiosResponse<ApiResponse<Receipt>> = await axios.post(Endpoint.CREATE_RECEIPT, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to record receipt");
    }
  },

  // Module 9: post one receipt split across multiple invoices in a single
  // transactional call -- see allocations doc on the Receipt interface.
  async allocateReceipt(data: CreateReceiptAllocationData): Promise<ApiResponse<Receipt>> {
    try {
      const response: AxiosResponse<ApiResponse<Receipt>> = await axios.post(Endpoint.CREATE_RECEIPT_ALLOCATION, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to allocate receipt");
    }
  },

  async getAllReceipts(params?: { invoiceId?: string; partyId?: string; search?: string }): Promise<ApiResponse<Receipt[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Receipt[]>> = await axios.get(Endpoint.GET_ALL_RECEIPTS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch receipts");
    }
  },

  async getReceiptById(id: string): Promise<ApiResponse<Receipt>> {
    try {
      const response: AxiosResponse<ApiResponse<Receipt>> = await axios.get(`${Endpoint.GET_RECEIPT_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch receipt");
    }
  },
};
