import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

// Two-company Phase 3 Part A (claude/two-company-gap-analysis.md): the
// "All Complains" nav item from the Figma reference's Quality Packaging
// dashboard.
export interface Complaint {
  _id: string;
  complaintNumber: string;
  subject: string;
  description?: string;
  priority: string;
  status: string;
  resolutionNotes?: string;
  resolvedAt?: string | null;
  party?: { _id: string; partyName: string } | null;
  order?: { _id: string; orderNumber: string } | null;
  assignedTo?: { _id: string; firstName: string; lastName: string } | null;
  // Absent/null means visible to every company, same convention as
  // product_items (Phase 1) and dye_punches (Phase 2 Part A).
  companyName?: { _id: string; companyName: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateComplaintData {
  subject: string;
  description?: string;
  priority?: string;
  party?: string;
  order?: string;
  assignedTo?: string;
  companyName?: string;
}

export interface UpdateComplaintData extends Partial<CreateComplaintData> {
  status?: string;
  resolutionNotes?: string;
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

export const complaintService = {
  async createComplaint(data: CreateComplaintData): Promise<ApiResponse<Complaint>> {
    try {
      const response: AxiosResponse<ApiResponse<Complaint>> = await axios.post(Endpoint.CREATE_COMPLAINT, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create complaint");
    }
  },

  async getAllComplaints(params?: { companyName?: string; search?: string; status?: string; priority?: string }): Promise<ApiResponse<Complaint[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Complaint[]>> = await axios.get(Endpoint.GET_ALL_COMPLAINTS, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch complaints");
    }
  },

  async updateComplaint(id: string, data: UpdateComplaintData): Promise<ApiResponse<Complaint>> {
    try {
      const response: AxiosResponse<ApiResponse<Complaint>> = await axios.patch(`${Endpoint.UPDATE_COMPLAINT}/${id}`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update complaint");
    }
  },

  async deleteComplaint(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_COMPLAINT}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete complaint");
    }
  },
};
