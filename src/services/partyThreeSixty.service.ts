import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

// Module 15: CRM 360-degree party view -- aggregates orders, quotations,
// invoices, receipts, opportunities, and calls for one party into one
// payload, computed live on every call (same philosophy as every other
// "report" in this app).

export interface PartyThreeSixty {
  party: { _id: string; partyName: string };
  summary: {
    orderCount: number;
    quotationCount: number;
    invoiceCount: number;
    openOpportunityCount: number;
    revenue: number;
    outstanding: number;
  };
  orders: { _id: string; orderNumber: string; qty: number; status: string; expectedDeliveryDate?: string; createdAt: string }[];
  quotations: { _id: string; quotationNumber: string; status: string; totalAmount?: number; createdAt: string }[];
  invoices: { _id: string; invoiceNumber: string; status: string; grandTotal: number; amountPaid: number; invoiceDate: string }[];
  receipts: { _id: string; receiptNumber: string; amount: number; paymentDate: string }[];
  opportunities: { _id: string; opportunityNumber: string; stage: string; estimatedValue?: number; createdAt: string }[];
  calls: { _id: string; reason?: string; status?: string; date?: string; callFeedback?: string }[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const authHeaders = () => {
  const token = authService.getToken();
  if (!token) throw new Error("No authentication token found");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
};

export const partyThreeSixtyService = {
  async getPartyThreeSixty(accountMasterId: string): Promise<ApiResponse<PartyThreeSixty>> {
    try {
      const response: AxiosResponse<ApiResponse<PartyThreeSixty>> = await axios.get(`${Endpoint.GET_PARTY_360}/${accountMasterId}/360`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch party 360 view");
    }
  },
};
