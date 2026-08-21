import axios from 'axios';
import Endpoint from '@/API/apiConfig';
import { authService } from './auth.service';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportLogEntry {
  _id: string;
  module: string;
  fileName: string | null;
  totalRows: number;
  successCount: number;
  failedCount: number;
  errors: ImportRowError[];
  importedBy?: { firstName?: string; lastName?: string; email?: string } | null;
  createdAt: string;
}

export interface ImportHistoryResponse {
  success: boolean;
  data?: ImportLogEntry[];
  message?: string;
}

// §77: shared client for GET /api/import-history/:module, backing every
// module's bulk-import history view rather than a one-off per module.
export const importHistoryService = {
  async getImportHistory(module: string): Promise<ImportHistoryResponse> {
    try {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await axios.get<ImportHistoryResponse>(
        `${Endpoint.IMPORT_HISTORY}/${module}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Failed to fetch import history'
      );
    }
  },
};
