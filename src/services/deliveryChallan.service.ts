import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface DeliveryChallan {
  _id: string;
  challanNumber: string;
  orderId: string;
  companyName?: { _id: string; companyName: string };
  party?: { _id: string; partyName: string };
  quantityDelivered: number;
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  driverContact?: string;
  packageCount?: number;
  packageWeight?: number;
  deliveryDate?: string;
  status: "Dispatched" | "Delivered" | "Cancelled";
  podReceivedBy?: string;
  podDesignation?: string;
  podReceivedAt?: string;
  podNotes?: string;
  podSignatureUrl?: string;
  notes?: string;
  createdBy?: { _id: string; firstName: string; lastName: string };
  createdAt?: string;
  updatedAt?: string;
}

interface CreateDeliveryChallanData {
  orderId: string;
  quantityDelivered: number;
  vehicleNumber?: string;
  vehicleType?: string;
  driverName?: string;
  driverContact?: string;
  packageCount?: number;
  packageWeight?: number;
  deliveryDate?: string;
  notes?: string;
}

interface RecordPodData {
  podReceivedBy: string;
  podDesignation?: string;
  podNotes?: string;
  podSignatureUrl?: string;
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

export const deliveryChallanService = {
  async createDeliveryChallan(data: CreateDeliveryChallanData): Promise<ApiResponse<DeliveryChallan>> {
    try {
      const response: AxiosResponse<ApiResponse<DeliveryChallan>> = await axios.post(Endpoint.CREATE_DELIVERY_CHALLAN, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create delivery challan");
    }
  },

  async getAllDeliveryChallans(params?: { orderId?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<DeliveryChallan[]>> {
    try {
      const response: AxiosResponse<ApiResponse<DeliveryChallan[]>> = await axios.get(Endpoint.GET_ALL_DELIVERY_CHALLANS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch delivery challans");
    }
  },

  async getDeliveryChallanById(id: string): Promise<ApiResponse<DeliveryChallan>> {
    try {
      const response: AxiosResponse<ApiResponse<DeliveryChallan>> = await axios.get(`${Endpoint.GET_DELIVERY_CHALLAN_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch delivery challan");
    }
  },

  async recordProofOfDelivery(id: string, data: RecordPodData): Promise<ApiResponse<DeliveryChallan>> {
    try {
      const response: AxiosResponse<ApiResponse<DeliveryChallan>> = await axios.patch(`${Endpoint.RECORD_DELIVERY_CHALLAN_POD}/${id}/pod`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to record proof of delivery");
    }
  },

  async cancelDeliveryChallan(id: string, remarks: string): Promise<ApiResponse<DeliveryChallan>> {
    try {
      const response: AxiosResponse<ApiResponse<DeliveryChallan>> = await axios.patch(
        `${Endpoint.CANCEL_DELIVERY_CHALLAN}/${id}/cancel`,
        { remarks },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to cancel delivery challan");
    }
  },

  async getDeliveryChallanPdf(id: string): Promise<Blob> {
    try {
      const response = await axios.get(`${Endpoint.GET_DELIVERY_CHALLAN_PDF}/${id}/pdf`, {
        headers: authHeaders(),
        withCredentials: true,
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to generate delivery challan PDF");
    }
  },
};
