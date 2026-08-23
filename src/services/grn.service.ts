import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface GrnItem {
  _id: string;
  quantityReceived: number;
  rate: number;
  purchaseOrderItemId: string;
  inventoryId?: string;
  material?: { _id: string; materialName: string };
}

export interface Grn {
  _id: string;
  grnNumber: string;
  receivedDate: string;
  notes?: string;
  // Module 11 Part B: supplier invoice reference, both optional.
  vendorInvoiceNumber?: string;
  vendorInvoiceDate?: string;
  purchaseOrder?: { _id: string; poNumber: string; status: string };
  vendor?: { _id: string; name: string };
  companyName?: { _id: string; companyName: string };
  forRole?: { _id: string; roleName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  items?: GrnItem[];
  createdAt?: string;
}

interface CreateGrnData {
  purchaseOrderId: string;
  receivedDate: string;
  forRole: string;
  forCompany: string;
  notes?: string;
  items: { purchaseOrderItemId: string; materialId: string; quantityReceived: number; rate: number }[];
  vendorInvoiceNumber?: string;
  vendorInvoiceDate?: string;
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

export const grnService = {
  async createGrn(data: CreateGrnData): Promise<ApiResponse<Grn>> {
    try {
      const response: AxiosResponse<ApiResponse<Grn>> = await axios.post(Endpoint.CREATE_GRN, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to post GRN");
    }
  },

  async getAllGrns(params?: { purchaseOrderId?: string; search?: string }): Promise<ApiResponse<Grn[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Grn[]>> = await axios.get(Endpoint.GET_ALL_GRNS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch GRNs");
    }
  },

  async getGrnById(id: string): Promise<ApiResponse<Grn>> {
    try {
      const response: AxiosResponse<ApiResponse<Grn>> = await axios.get(`${Endpoint.GET_GRN_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch GRN");
    }
  },
};
