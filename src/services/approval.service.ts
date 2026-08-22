import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

// One entry per module the backend's approval.controller.js can surface --
// currently just Quotation and Purchase Order, the only two modules with a
// real Pending Approval step (see the Module 6 design plan).
export interface PendingApproval {
  _id: string;
  type: "quotation" | "purchaseOrder";
  moduleKey: string;
  number: string;
  createdAt: string;
  companyName?: { companyName: string };
  party?: { partyName: string } | null;
  vendor?: { name: string } | null;
  createdBy?: { firstName: string; lastName: string };
  link: string;
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

export const approvalService = {
  async getMyPendingApprovals(): Promise<ApiResponse<PendingApproval[]>> {
    try {
      const response: AxiosResponse<ApiResponse<PendingApproval[]>> = await axios.get(Endpoint.GET_PENDING_APPROVALS, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message, count: response.data.count };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch pending approvals");
    }
  },
};
