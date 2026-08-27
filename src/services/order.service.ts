import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";
// Order/PaperField live in orderSlice.ts (the fuller, canonical shape used
// across all order-detail pages); imported here as types only so there's no
// runtime circular dependency and no divergent duplicate definition.
import type { Order, PaperField } from "@/store/slices/orderSlice";

export type { Order, PaperField };

interface CreateOrderData {
  companyName: string;
  party: string;
  productItem: string;
  qty: number;
  remarks?: string;
  filePaths?: string[];
  createdBy?: string;
  customerPoNumber?: string;
  priority?: string;
  expectedDeliveryDate?: string;
}

// Order Form batch create (Godown Manager Figma audit, Patch 108): one row
// shape, same field set createOrder's own payload accepts minus
// companyName/createdBy (supplied once for the whole form).
export interface CreateOrderFormRow {
  party: string;
  productItem: string;
  qty: number;
  remarks?: string;
  size?: string;
  rate?: number;
  rateType?: string;
  ply?: number;
  deckal?: number;
  gsm?: number;
  orderFrom?: string;
  orderDate?: string;
  dyeNumber?: string;
  dyeSize?: string;
  dyeSheetSize?: string;
  dyeRemark?: string;
  godownRemark?: string;
  factoryRemarks?: string;
  deliveryDestination?: string;
  orderType?: string;
}

export interface CreateOrderFormData {
  companyName: string;
  createdBy?: string;
  orders: CreateOrderFormRow[];
}

export interface OrderFormResult {
  orderFormId: string;
  orderFormNumber: string;
  orders: Order[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const orderService = {
  // Create Order
  async createOrder(data: CreateOrderData): Promise<ApiResponse<Order>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order>> = await axios.post(
        Endpoint.CREATE_ORDER,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Create order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to create order"
      );
    }
  },

  // Order Form batch create (Godown Manager Figma audit, Patch 108)
  async createOrderForm(
    data: CreateOrderFormData
  ): Promise<ApiResponse<OrderFormResult>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<OrderFormResult>> = await axios.post(
        Endpoint.CREATE_ORDER_FORM,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Create order form error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to create order form"
      );
    }
  },

  // Get All Orders
  async getAllOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    companyName?: string;
    party?: string;
    search?: string;
    // Order To Factory page (Build 4, 2026-08-27): optional server-side
    // filter, additive alongside the existing params above -- mirrors
    // order.controller.js's getAllOrders `orderFrom` query param.
    orderFrom?: string;
  }): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const queryParams: any = {};
      if (params?.page) queryParams.page = params.page;
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.status) queryParams.status = params.status;
      if (params?.companyName) queryParams.companyName = params.companyName;
      if (params?.party) queryParams.party = params.party;
      if (params?.search) queryParams.search = params.search;
      if (params?.orderFrom) queryParams.orderFrom = params.orderFrom;

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        Endpoint.GET_ALL_ORDERS,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: queryParams,
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
        pagination: response.data.pagination,
      };
    } catch (error: any) {
      console.error("Service: Get all orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  },
  // Add this method to your orderService in order.service.ts
  async getOrdersByStaffId(id: string): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_ORDER_BY_STAFF_ID}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get orders by staff ID error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch orders by staff ID"
      );
    }
  },


  // Get Order By ID
  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order>> = await axios.get(
        `${Endpoint.GET_ORDER_BY_ID}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get order by ID error:", error);
      throw new Error(error.response?.data?.message || "Failed to fetch order");
    }
  },

  // Update Order
  async updateOrder(
    id: string,
    data: Partial<CreateOrderData & {
    printerPapers?: PaperField[];
    binderPapers?: PaperField[];
    bookletPapers?: PaperField[];
  }>

  ): Promise<ApiResponse<Order>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order>> = await axios.put(
        `${Endpoint.UPDATE_ORDER}/${id}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Update order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to update order"
      );
    }
  },

  // Delete Order
  async deleteOrder(id: string): Promise<ApiResponse<null>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(
        `${Endpoint.DELETE_ORDER}/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Delete order error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to delete order"
      );
    }
  },

  // Get Orders by Company and Party
  async getOrdersByCompanyAndParty(
    companyId: string,
    partyId: string
  ): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_ORDERS_BY_COMPANY_PARTY}/company/${companyId}/party/${partyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get orders by company and party error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  },

  //GET DESIGNER ORDER
  async getDesignerOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_DESIGNER_ORDERS}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get designer orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch designer orders"
      );
    }
  },

  //GET PRINTER ORDER
  async getPrinterOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_PRINTER_ORDERS}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get designer orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch designer orders"
      );
    }
  },


  //GET BINDER ORDER
  async getBinderOrders(): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_PRINTER_BINDER}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get designer orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch designer orders"
      );
    }
  },

  //GET BOOKLET BINDER
  async getBookletBinder(): Promise<ApiResponse<Order[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response: AxiosResponse<ApiResponse<Order[]>> = await axios.get(
        `${Endpoint.GET_BOOKLET_BINDER}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      return {
        success: response.data.success,
        data: response.data.data || [],
        message: response.data.message,
      };
    } catch (error: any) {
      console.error("Service: Get designer orders error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch designer orders"
      );
    }
  },
};
