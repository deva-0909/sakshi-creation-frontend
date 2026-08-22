import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface VendorPayment {
  _id: string;
  paymentNumber: string;
  amount: number;
  paymentDate: string;
  mode: "Cash" | "Bank Transfer" | "UPI" | "Cheque" | "Other";
  referenceNumber?: string;
  notes?: string;
  vendor?: { _id: string; name: string };
  purchaseOrder?: { _id: string; poNumber: string; status: string };
  companyName?: { _id: string; companyName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  createdAt?: string;
}

interface CreateVendorPaymentData {
  vendorId: string;
  purchaseOrderId?: string;
  companyName: string;
  amount: number;
  paymentDate: string;
  mode: string;
  referenceNumber?: string;
  notes?: string;
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

export const vendorPaymentService = {
  async createVendorPayment(data: CreateVendorPaymentData): Promise<ApiResponse<VendorPayment>> {
    try {
      const response: AxiosResponse<ApiResponse<VendorPayment>> = await axios.post(Endpoint.CREATE_VENDOR_PAYMENT, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to record vendor payment");
    }
  },

  async getAllVendorPayments(params?: { vendorId?: string; purchaseOrderId?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<VendorPayment[]>> {
    try {
      const response: AxiosResponse<ApiResponse<VendorPayment[]>> = await axios.get(Endpoint.GET_ALL_VENDOR_PAYMENTS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch vendor payments");
    }
  },

  async getVendorPaymentById(id: string): Promise<ApiResponse<VendorPayment>> {
    try {
      const response: AxiosResponse<ApiResponse<VendorPayment>> = await axios.get(`${Endpoint.GET_VENDOR_PAYMENT_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch vendor payment");
    }
  },
};
