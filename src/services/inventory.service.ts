import axios, { AxiosResponse } from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

const BaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8383";

export interface Inventory {
  _id: string;
  category: string;
  type: 'inward' | 'outward';
  material: any;
  quantity: number;
  kg: number;
  vendor: any;
  date: string;
  purchase?: string;
  companyName: any;
  for: any;
  forCompany: any;
  // Full Figma slide scan Phase 4 (Theme 7): order/party on outward rows
  // (null on inward purchase rows) and Factory dye/punch mirroring --
  // see inventory.controller.js's SELECT for what actually populates these.
  order?: { _id: string; orderNumber?: string } | null;
  party?: { _id: string; partyName?: string } | null;
  dyePunchNumber?: string | null;
  ply?: string | null;
  sheetSize?: string | null;
  boxSize?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

export const inventoryService = {
  // Mobile/toggle/seed audit (2026-08-26), Phase C: companyName filters to
  // one company's inventory entries; omitted keeps today's behavior (both
  // companies mixed).
  async getInventoryByCategory(category: string, params?: { companyName?: string }): Promise<ApiResponse<Inventory[]>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<Inventory[]>> = await axios.get(
        `${Endpoint.GET_BY_CATEGORY}/${category}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch inventory by category'
      );
    }
  },

  async getInventorySummary(category: string, params?: { companyName?: string }): Promise<ApiResponse<{ lastPurchase: number, usedQty: number, balance: number }>> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response: AxiosResponse<ApiResponse<{ lastPurchase: number, usedQty: number, balance: number }>> = await axios.get(
        `${Endpoint.GET_CATEGORY}/${category}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch inventory summary'
      );
    }
  },

  
};