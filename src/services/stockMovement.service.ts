import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface StockTransfer {
  _id: string;
  transferNumber: string;
  quantity: number;
  category: string;
  transferDate: string;
  notes?: string;
  createdAt?: string;
  material?: { _id: string; materialName: string };
  fromWarehouse?: { _id: string; warehouseName: string } | null;
  toWarehouse?: { _id: string; warehouseName: string };
  companyName?: { _id: string; companyName: string };
}

export interface CreateStockTransferData {
  materialId: string;
  quantity: number;
  category: string;
  fromWarehouse?: string;
  toWarehouse: string;
  companyName: string;
  forRole: string;
  forCompany: string;
  transferDate?: string;
  notes?: string;
}

export interface StockAdjustment {
  _id: string;
  adjustmentNumber: string;
  category: string;
  adjustmentType: "Increase" | "Decrease";
  quantity: number;
  reason: string;
  adjustmentDate: string;
  createdAt?: string;
  material?: { _id: string; materialName: string };
  warehouse?: { _id: string; warehouseName: string } | null;
  companyName?: { _id: string; companyName: string };
}

export interface CreateStockAdjustmentData {
  materialId: string;
  warehouse?: string;
  category: string;
  adjustmentType: "Increase" | "Decrease";
  quantity: number;
  reason: string;
  companyName: string;
  forRole: string;
  forCompany: string;
  adjustmentDate?: string;
}

export interface StockReservation {
  _id: string;
  reservationNumber: string;
  category?: string;
  quantity: number;
  reservedFor?: string;
  status: "Active" | "Consumed" | "Cancelled";
  notes?: string;
  createdAt?: string;
  material?: { _id: string; materialName: string };
  warehouse?: { _id: string; warehouseName: string } | null;
  companyName?: { _id: string; companyName: string };
}

export interface CreateStockReservationData {
  materialId: string;
  warehouse?: string;
  category?: string;
  quantity: number;
  reservedFor?: string;
  notes?: string;
  companyName: string;
  forRole: string;
  forCompany: string;
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

export const stockMovementService = {
  async createTransfer(data: CreateStockTransferData): Promise<ApiResponse<StockTransfer>> {
    try {
      const response: AxiosResponse<ApiResponse<StockTransfer>> = await axios.post(Endpoint.CREATE_STOCK_TRANSFER, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to record stock transfer");
    }
  },

  async getAllTransfers(params?: { materialId?: string; warehouse?: string; companyName?: string }): Promise<ApiResponse<StockTransfer[]>> {
    try {
      const response: AxiosResponse<ApiResponse<StockTransfer[]>> = await axios.get(Endpoint.GET_ALL_STOCK_TRANSFERS, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch stock transfers");
    }
  },

  async createAdjustment(data: CreateStockAdjustmentData): Promise<ApiResponse<StockAdjustment>> {
    try {
      const response: AxiosResponse<ApiResponse<StockAdjustment>> = await axios.post(Endpoint.CREATE_STOCK_ADJUSTMENT, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to record stock adjustment");
    }
  },

  async getAllAdjustments(params?: { materialId?: string; warehouse?: string; companyName?: string }): Promise<ApiResponse<StockAdjustment[]>> {
    try {
      const response: AxiosResponse<ApiResponse<StockAdjustment[]>> = await axios.get(Endpoint.GET_ALL_STOCK_ADJUSTMENTS, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch stock adjustments");
    }
  },

  async createReservation(data: CreateStockReservationData): Promise<ApiResponse<StockReservation>> {
    try {
      const response: AxiosResponse<ApiResponse<StockReservation>> = await axios.post(Endpoint.CREATE_STOCK_RESERVATION, data, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create stock reservation");
    }
  },

  async getAllReservations(params?: { materialId?: string; warehouse?: string; status?: string; companyName?: string }): Promise<ApiResponse<StockReservation[]>> {
    try {
      const response: AxiosResponse<ApiResponse<StockReservation[]>> = await axios.get(Endpoint.GET_ALL_STOCK_RESERVATIONS, { headers: authHeaders(), params, withCredentials: true });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch stock reservations");
    }
  },

  async updateReservationStatus(id: string, status: "Consumed" | "Cancelled"): Promise<ApiResponse<StockReservation>> {
    try {
      const response: AxiosResponse<ApiResponse<StockReservation>> = await axios.patch(
        `${Endpoint.UPDATE_STOCK_RESERVATION_STATUS}/${id}/status`,
        { status },
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update reservation status");
    }
  },

  async deleteReservation(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_STOCK_RESERVATION}/${id}`, { headers: authHeaders(), withCredentials: true });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete reservation");
    }
  },
};
