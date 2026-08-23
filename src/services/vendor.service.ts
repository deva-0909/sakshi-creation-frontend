import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

export interface Vendor {
  _id: string;
  companyName: string | { _id: string; companyName: string };
  name: string;
  contactNumber: string;
  whatsappNumber: string;
  gst: string;
  address: string;
  // Module 9: optional payable credit limit -- undefined/null means no
  // limit configured.
  creditLimit?: number;
  status?: string;
  // Module 11 Part B: banking/commercial terms -- all optional.
  pan?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  paymentTerms?: string;
  creditPeriodDays?: number;
  vendorCategory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendor {
  companyName: string;
  name: string;
  contactNumber: string;
  whatsappNumber: string;
  gst?: string;
  address: string;
  creditLimit?: number;
  status?: string;
  pan?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  paymentTerms?: string;
  creditPeriodDays?: number;
  vendorCategory?: string;
}

export interface UpdateVendor {
  companyName?: string;
  name?: string;
  contactNumber?: string;
  whatsappNumber?: string;
  gst?: string;
  address?: string;
  creditLimit?: number;
  status?: string;
  pan?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankName?: string;
  paymentTerms?: string;
  creditPeriodDays?: number;
  vendorCategory?: string;
}

// Module 11 Part B: live-computed rate history + on-time-delivery
// performance -- no new table, matches Stock Ledger/Costing's precedent.
export interface VendorRateHistoryRow {
  material: { _id: string; materialName: string } | null;
  rate: number;
  quantityOrdered: number;
  purchaseOrder: { _id: string; poNumber: string; status: string } | null;
  orderedAt: string;
}

export interface VendorDelivery {
  poId: string;
  poNumber: string;
  expectedDate: string;
  firstReceivedDate: string;
  delayDays: number;
  onTime: boolean;
}

export interface VendorPerformance {
  totalDeliveries: number;
  onTimeCount: number;
  lateCount: number;
  onTimePercentage: number | null;
  averageDelayDays: number | null;
  deliveries: VendorDelivery[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ImportRowError {
  row: number;
  message: string;
}

// §77: the bulk-create endpoint's response now carries per-row outcomes
// alongside the created records, instead of an all-or-nothing result.
export interface BulkImportResponse<T> {
  success: boolean;
  message?: string;
  count?: number;
  errors?: ImportRowError[];
  data?: T;
}

export const vendorService = {
  async getVendors(): Promise<ApiResponse<Vendor[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Vendor[]>> = await axios.get(
        Endpoint.GET_ALL_VENDORS,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch vendors'
      );
    }
  },

  async getVendorById(id: string): Promise<ApiResponse<Vendor>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Vendor>> = await axios.get(
        `${Endpoint.GET_VENDOR_BY_ID}/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch vendor'
      );
    }
  },

  async createVendor(data: CreateVendor): Promise<Vendor> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Vendor>> = await axios.post(
        Endpoint.CREATE_VENDOR,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to create vendor'
      );
    }
  },

  async updateVendor(id: string, data: Partial<UpdateVendor>): Promise<Vendor> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Vendor>> = await axios.patch(
        `${Endpoint.UPDATE_VENDOR}/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data.data!;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to update vendor'
      );
    }
  },

  async deleteVendor(id: string): Promise<void> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`${Endpoint.DELETE_VENDOR}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to delete vendor'
      );
    }
  },

  async bulkCreateVendors(formData: FormData): Promise<BulkImportResponse<Vendor[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<BulkImportResponse<Vendor[]>> = await axios.post(
        Endpoint.BULK_CREATE_VENDORS,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to bulk create vendors'
      );
    }
  },

  async getVendorRateHistory(vendorId: string, materialId?: string): Promise<ApiResponse<VendorRateHistoryRow[]>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error('No authentication token found');
      const response: AxiosResponse<ApiResponse<VendorRateHistoryRow[]>> = await axios.get(
        `${Endpoint.GET_VENDOR_RATE_HISTORY}/${vendorId}/rate-history`,
        { headers: { Authorization: `Bearer ${token}` }, params: materialId ? { materialId } : undefined, withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vendor rate history');
    }
  },

  async getVendorPerformance(vendorId: string): Promise<ApiResponse<VendorPerformance>> {
    try {
      const token = authService.getToken();
      if (!token) throw new Error('No authentication token found');
      const response: AxiosResponse<ApiResponse<VendorPerformance>> = await axios.get(
        `${Endpoint.GET_VENDOR_PERFORMANCE}/${vendorId}/performance`,
        { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch vendor performance');
    }
  },
};