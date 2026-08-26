import axios, { type AxiosResponse } from "axios";
import Endpoint from "@/API/apiConfig";
import { authService } from "./auth.service";

// Multi-role audit fix (Finding 5): widened to include Quality Packaging's
// real equipment categories alongside Sakshi Creation's print-shop ones.
export type MachineCategory =
  | "Printer"
  | "Binder"
  | "Booklet Binder"
  | "Corrugation"
  | "Printing"
  | "Conversion"
  | "Punching";

export interface Machine {
  _id: string;
  machineName: string;
  machineCode: string;
  category: MachineCategory;
  capacity?: string;
  status: "Active" | "Under Maintenance" | "Inactive";
  purchaseDate?: string;
  notes?: string;
  companyName?: { _id: string; companyName: string };
  createdBy?: { _id: string; firstName: string; lastName: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMachineData {
  machineName: string;
  machineCode: string;
  category: MachineCategory;
  companyName: string;
  capacity?: string;
  status?: "Active" | "Under Maintenance" | "Inactive";
  purchaseDate?: string;
  notes?: string;
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

export const machineService = {
  async createMachine(data: CreateMachineData): Promise<ApiResponse<Machine>> {
    try {
      const response: AxiosResponse<ApiResponse<Machine>> = await axios.post(Endpoint.CREATE_MACHINE, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create machine");
    }
  },

  async getAllMachines(params?: { category?: string; status?: string; companyName?: string }): Promise<ApiResponse<Machine[]>> {
    try {
      const response: AxiosResponse<ApiResponse<Machine[]>> = await axios.get(Endpoint.GET_ALL_MACHINES, {
        headers: authHeaders(),
        params,
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data || [], message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch machines");
    }
  },

  async getMachineById(id: string): Promise<ApiResponse<Machine>> {
    try {
      const response: AxiosResponse<ApiResponse<Machine>> = await axios.get(`${Endpoint.GET_MACHINE_BY_ID}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch machine");
    }
  },

  async updateMachine(id: string, data: Partial<CreateMachineData>): Promise<ApiResponse<Machine>> {
    try {
      const response: AxiosResponse<ApiResponse<Machine>> = await axios.patch(`${Endpoint.UPDATE_MACHINE}/${id}`, data, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, data: response.data.data, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update machine");
    }
  },

  async deleteMachine(id: string): Promise<ApiResponse<null>> {
    try {
      const response: AxiosResponse<ApiResponse<null>> = await axios.delete(`${Endpoint.DELETE_MACHINE}/${id}`, {
        headers: authHeaders(),
        withCredentials: true,
      });
      return { success: response.data.success, message: response.data.message };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete machine");
    }
  },
};
