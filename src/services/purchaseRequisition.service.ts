import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface PurchaseRequisitionItem {
  _id: string;
  quantityRequired: number;
  notes?: string;
  material?: { _id: string; materialName: string; materialSize?: string; materialGSM?: number };
}

export interface PurchaseRequisition {
  _id: string;
  requisitionNumber: string;
  status: "Draft" | "Pending Approval" | "Approved" | "Rejected" | "Cancelled" | "Converted";
  notes?: string;
  approvedAt?: string;
  companyName?: { _id: string; companyName: string };
  requestedBy?: { _id: string; firstName: string; lastName: string };
  approvedBy?: { _id: string; firstName: string; lastName: string };
  convertedToRfqId?: string;
  convertedToPoId?: string;
  items?: PurchaseRequisitionItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseRequisitionHistoryEntry {
  _id: string;
  fromStatus?: string;
  toStatus: string;
  remarks?: string;
  createdAt: string;
  changedBy?: { _id: string; firstName: string; lastName: string };
}

interface CreatePurchaseRequisitionData {
  companyName: string;
  notes?: string;
  items: { materialId: string; quantityRequired: number; notes?: string }[];
}

interface ConvertToPoData {
  vendorId: string;
  expectedDate?: string;
  notes?: string;
  items: { requisitionItemId: string; rate: number }[];
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

export const purchaseRequisitionService = {
  async createPurchaseRequisition(data: CreatePurchaseRequisitionData): Promise<ApiResponse<PurchaseRequisition>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseRequisition>> = await axios.post(Endpoint.CREATE_PURCHASE_REQUISITION, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create purchase requisition");
    }
  },

  async getAllPurchaseRequisitions(params?: { status?: string; search?: string; page?: number; limit?: number; companyName?: string }): Promise<ApiResponse<PurchaseRequisition[]>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseRequisition[]>> = await axios.get(Endpoint.GET_ALL_PURCHASE_REQUISITIONS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch purchase requisitions");
    }
  },

  async getPurchaseRequisitionById(id: string): Promise<ApiResponse<PurchaseRequisition>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseRequisition>> = await axios.get(`${Endpoint.GET_PURCHASE_REQUISITION_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch purchase requisition");
    }
  },

  async deletePurchaseRequisition(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_PURCHASE_REQUISITION}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete purchase requisition");
    }
  },

  async submitForApproval(id: string): Promise<ApiResponse<PurchaseRequisition>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseRequisition>> = await axios.patch(
        `${Endpoint.SUBMIT_PR_FOR_APPROVAL}/${id}/submit-for-approval`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to submit for approval");
    }
  },

  async approvePurchaseRequisition(id: string): Promise<ApiResponse<PurchaseRequisition>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseRequisition>> = await axios.patch(
        `${Endpoint.APPROVE_PR}/${id}/approve`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to approve purchase requisition");
    }
  },

  async rejectPurchaseRequisition(id: string, remarks: string): Promise<ApiResponse<PurchaseRequisition>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseRequisition>> = await axios.patch(
        `${Endpoint.REJECT_PR}/${id}/reject`,
        { remarks },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to reject purchase requisition");
    }
  },

  async cancelPurchaseRequisition(id: string, remarks: string): Promise<ApiResponse<PurchaseRequisition>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseRequisition>> = await axios.patch(
        `${Endpoint.CANCEL_PR}/${id}/cancel`,
        { remarks },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to cancel purchase requisition");
    }
  },

  async convertToRfq(id: string): Promise<ApiResponse<{ rfqId: string }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ rfqId: string }>> = await axios.post(
        `${Endpoint.CONVERT_PR_TO_RFQ}/${id}/convert-to-rfq`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to convert requisition to RFQ");
    }
  },

  async convertToPo(id: string, data: ConvertToPoData): Promise<ApiResponse<{ poId: string }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ poId: string }>> = await axios.post(
        `${Endpoint.CONVERT_PR_TO_PO}/${id}/convert-to-po`,
        data,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to convert requisition to purchase order");
    }
  },

  async getPurchaseRequisitionHistory(id: string): Promise<ApiResponse<PurchaseRequisitionHistoryEntry[]>> {
    try {
      const response: AxiosResponse<ApiResponse<PurchaseRequisitionHistoryEntry[]>> = await axios.get(
        `${Endpoint.GET_PR_HISTORY}/${id}/history`,
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch purchase requisition history");
    }
  },
};
