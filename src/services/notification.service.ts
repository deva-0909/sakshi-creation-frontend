import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
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

export const notificationService = {
  async getMyNotifications(params?: { unreadOnly?: boolean; page?: number; limit?: number }): Promise<ApiResponse<Notification[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Notification[]>> = await axios.get(Endpoint.GET_MY_NOTIFICATIONS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, pagination: response.data.pagination };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch notifications");
    }
  },

  async getUnreadCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ unreadCount: number }>> = await axios.get(Endpoint.GET_UNREAD_NOTIFICATION_COUNT, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch unread count");
    }
  },

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    try {
      const response: AxiosResponse<ApiResponse<Notification>> = await axios.patch(
        `${Endpoint.MARK_NOTIFICATION_READ}/${id}/read`,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to mark notification as read");
    }
  },

  async markAllAsRead(): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.patch(
        Endpoint.MARK_ALL_NOTIFICATIONS_READ,
        {},
        { headers: authHeaders(), withCredentials: true }
      );
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to mark all notifications as read");
    }
  },
};
