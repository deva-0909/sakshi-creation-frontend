import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface PurchaseOrderItem {
  _id: string;
  quantityOrdered: number;
  rate: number;
  quantityReceived: number;
  material?: { _id: string; materialName: string; materialSize?: string; materialGSM?: number };
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  status: "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Sent" | "Partially Received" | "Received" | "Cancelled";
  expectedDate?: string;
  notes?: string;
  approvedAt?: string;
  sentAt?: string;
  // Module 11 Part B: additive vendor-facing acknowledgement -- not a
  // status, orthogonal metadata set any time after "Sent".
  acknowledgedAt?: string;
  rfqId?: string;
  vendor?: { _id: string; name: string };
  companyName?: { _id: string; companyName: string };
  approvedBy?: { _id: string; firstName: string; lastName: string };
  acknowledgedBy?: { _id: string; firstName: string; lastName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  items?: PurchaseOrderItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderHistoryEntry {
  _id: string;
  fromStatus?: string;
  toStatus: string;
  remarks?: string;
  createdAt: string;
  changedBy?: { _id: string; firstName: string; lastName: string };
}

interface CreatePurchaseOrderData {
  vendorId: string;
  companyName: string;
  expectedDate?: string;
  notes?: string;
  items: { materialId: string; quantityOrdered: number; rate: number }[];
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

export const purchaseOrderService = {
  async createPurchaseOrder(data: CreatePurchaseOrderData): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder>> = await axios.post(Endpoint.CREATE_PURCHASE_ORDER, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create purchase order");
    }
  },

  async selectWinningQuote(quoteId: string, expectedDate?: string, notes?: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder>> = await axios.post(
        `${Endpoint.SELECT_WINNING_QUOTE}/${quoteId}`,
        { expectedDate, notes },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to select winning quote");
    }
  },

  async getAllPurchaseOrders(params?: { status?: string; vendorId?: string; search?: string; page?: number; limit?: number; companyName?: string }): Promise<ApiResponse<PurchaseOrder[]>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder[]>> = await axios.get(Endpoint.GET_ALL_PURCHASE_ORDERS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch purchase orders");
    }
  },

  async getPurchaseOrderById(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder>> = await axios.get(`${Endpoint.GET_PURCHASE_ORDER_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch purchase order");
    }
  },

  async deletePurchaseOrder(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_PURCHASE_ORDER}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete purchase order");
    }
  },

  async submitForApproval(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder>> = await axios.patch(
        `${Endpoint.SUBMIT_PO_FOR_APPROVAL}/${id}/submit-for-approval`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to submit for approval");
    }
  },

  async approvePurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder>> = await axios.patch(
        `${Endpoint.APPROVE_PO}/${id}/approve`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to approve purchase order");
    }
  },

  async rejectPurchaseOrder(id: string, remarks: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder>> = await axios.patch(
        `${Endpoint.REJECT_PO}/${id}/reject`,
        { remarks },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to reject purchase order");
    }
  },

  async sendPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder>> = await axios.patch(
        `${Endpoint.SEND_PO}/${id}/send`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to send purchase order");
    }
  },

  async acknowledgePurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder>> = await axios.patch(
        `${Endpoint.ACKNOWLEDGE_PO}/${id}/acknowledge`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to acknowledge purchase order");
    }
  },

  async cancelPurchaseOrder(id: string, remarks: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrder>> = await axios.patch(
        `${Endpoint.CANCEL_PO}/${id}/cancel`,
        { remarks },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to cancel purchase order");
    }
  },

  async getPurchaseOrderHistory(id: string): Promise<ApiResponse<PurchaseOrderHistoryEntry[]>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseOrderHistoryEntry[]>> = await axios.get(
        `${Endpoint.GET_PO_HISTORY}/${id}/history`,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch purchase order history");
    }
  },
};
