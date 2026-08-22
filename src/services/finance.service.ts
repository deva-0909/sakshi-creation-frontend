import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

// Module 9: read-only receivables/payables reports, computed live on the
// backend from invoices/receipts/credit notes (customer side) and purchase
// orders/purchases/vendor payments/debit notes (vendor side) -- never a
// second table kept in sync, same as the Stock Ledger (Module 2).

export interface LedgerRow {
  date: string;
  type: string;
  reference: string;
  debit: number;
  credit: number;
  refId: string;
  runningBalance: number;
}

export interface LedgerResult {
  party?: { _id: string; partyName: string; creditLimit?: number };
  vendor?: { _id: string; name: string; creditLimit?: number };
  outstandingBalance: number;
  creditLimit: number | null;
  overCreditLimit: boolean;
  closingBalance: number;
  rows: LedgerRow[];
}

export interface AgeingBuckets {
  Current: number;
  "1-30": number;
  "31-60": number;
  "61-90": number;
  "90+": number;
}

export interface CustomerAgeingRow {
  _id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  grandTotal: number;
  amountPaid: number;
  outstanding: number;
  daysOverdue: number;
  bucket: string;
  party?: { _id: string; partyName: string };
}

export interface VendorAgeingRow {
  type: string;
  reference: string;
  amount: number;
  daysOld: number;
  bucket: string;
  vendor?: { _id: string; name: string };
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

export const financeService = {
  async getCustomerLedger(partyId: string, params?: { from?: string; to?: string }): Promise<ApiResponse<LedgerResult>> {
    try {
      const response: AxiosResponse<ApiResponse<LedgerResult>> = await axios.get(`${Endpoint.GET_CUSTOMER_LEDGER}/${partyId}`, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch customer ledger");
    }
  },

  async getCustomerAgeing(params?: { partyId?: string; companyName?: string }): Promise<ApiResponse<{ buckets: AgeingBuckets; rows: CustomerAgeingRow[] }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ buckets: AgeingBuckets; rows: CustomerAgeingRow[] }>> = await axios.get(Endpoint.GET_CUSTOMER_AGEING, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch customer ageing");
    }
  },

  async getVendorLedger(vendorId: string, params?: { from?: string; to?: string }): Promise<ApiResponse<LedgerResult>> {
    try {
      const response: AxiosResponse<ApiResponse<LedgerResult>> = await axios.get(`${Endpoint.GET_VENDOR_LEDGER}/${vendorId}`, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch vendor ledger");
    }
  },

  async getVendorAgeing(params?: { vendorId?: string; companyName?: string }): Promise<ApiResponse<{ buckets: AgeingBuckets; rows: VendorAgeingRow[] }>> {
    try {
      const response: AxiosResponse<ApiResponse<{ buckets: AgeingBuckets; rows: VendorAgeingRow[] }>> = await axios.get(Endpoint.GET_VENDOR_AGEING, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch vendor ageing");
    }
  },
};
