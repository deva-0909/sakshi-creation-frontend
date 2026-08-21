import axios from 'axios';
import { authService } from '@/services/auth.service';

// §77: downloads the CSV bulk-import template straight from the backend
// (which is the actual source of truth for what columns an import file
// needs) instead of the client building its own hardcoded sample CSV that
// can silently drift out of sync with what the server expects.
export async function downloadBulkTemplate(url: string, filename: string): Promise<void> {
  const token = authService.getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.setAttribute('href', objectUrl);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}
