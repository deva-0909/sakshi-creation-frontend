import React, { useState, useEffect } from 'react';
import { Box, Typography, Stack } from '@mui/material';
import { toast } from 'react-toastify';
import CustomDialog from '@/component/customdialog';
import ThemeButton from '@/component/common_component/themebutton';
import ImportErrorsTable, { ImportRowError } from '@/component/bulkImport/ImportErrorsTable';
import ImportHistoryDialog from '@/component/bulkImport/ImportHistoryDialog';
import { downloadBulkTemplate } from '@/utils/downloadTemplate';
import Endpoint from '@/API/apiConfig';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  bulkCreateProductItemsThunk,
  clearProductItemError,
  clearProductItemSuccessMessage,
} from '@/store/slices/productItemSlice';

interface AddNewProductBulkDialogProps {
  open: boolean;
  onClose: () => void;
  refreshData?: () => void;
}

const AddNewProductBulkDialog: React.FC<AddNewProductBulkDialogProps> = ({
  open,
  onClose,
  refreshData,
}) => {
  const dispatch = useAppDispatch();
  const { loading, error, successMessage } = useAppSelector((state) => state.productItems);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [importErrors, setImportErrors] = useState<ImportRowError[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    setImportErrors([]);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await dispatch(bulkCreateProductItemsThunk(formData)).unwrap();
      const errors = result.errors || [];
      setImportErrors(errors);
      setImportSuccessCount(result.count || 0);
      if (refreshData) refreshData();
      setFile(null);
      // Keep the dialog open when some rows failed, so the user can see
      // which rows to fix; only close on a fully clean import.
      if (errors.length === 0) {
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || 'Bulk upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplateClick = async () => {
    try {
      await downloadBulkTemplate(Endpoint.BULK_PRODUCT_ITEM_TEMPLATE, 'productItem-bulk-import-template.csv');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download template');
    }
  };

  useEffect(() => {
    if (open) {
      dispatch(clearProductItemSuccessMessage());
      dispatch(clearProductItemError());
      setFile(null);
      setImportErrors([]);
      setImportSuccessCount(0);
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearProductItemError());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearProductItemSuccessMessage());
    }
  }, [error, successMessage, dispatch]);

  return (
    <CustomDialog open={open} maxWidth="sm" onClose={onClose} title="Bulk Upload Products">
      <Box sx={{ background: '#fff', borderRadius: 2, p: 3 }}>
        <Box mt={2}>
          <Typography fontWeight={500} fontSize={14} mb={1}>
            Upload CSV File
          </Typography>
          <Box
            sx={{
              border: '2px dashed #e0e0e0',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              backgroundColor: '#fafafa',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                borderColor: '#A409F8',
                backgroundColor: '#f5f5f5',
              },
              ...(file && {
                borderColor: '#4caf50',
                backgroundColor: '#f1f8e9',
              }),
            }}
            onClick={() => document.getElementById('bulk-file-input')?.click()}
          >
            <input
              id="bulk-file-input"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile && selectedFile.type === 'text/csv') {
                  setFile(selectedFile);
                } else {
                  toast.error('Please select a valid CSV file');
                }
              }}
              style={{ display: 'none' }}
            />
            {!file ? (
              <>
                <Typography variant="h6" color="textSecondary" sx={{ mb: 1 }}>
                  📁 Select CSV File
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Click here to upload a CSV file
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  Supported format: .csv
                </Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" color="success.main" sx={{ mb: 1 }}>
                  ✅ File Selected
                </Typography>
                <Typography variant="body2" color="textPrimary" fontWeight={500}>
                  {file.name}
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                  Size: {(file.size / 1024).toFixed(2)} KB
                </Typography>
              </>
            )}
          </Box>
        </Box>
        <ImportErrorsTable
          successCount={importSuccessCount}
          failedCount={importErrors.length}
          errors={importErrors}
        />
        <Stack direction="row" spacing={2} mt={3} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          <ThemeButton
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: '#A409F8',
              color: '#A409F8',
              '&:hover': { borderColor: '#7B06C2', color: '#7B06C2' },
            }}
          >
            {importErrors.length > 0 ? 'Close' : 'Cancel'}
          </ThemeButton>
          <ThemeButton
            disabled={!file || isLoading}
            onClick={handleSubmit}
            sx={{
              background: '#A409F8',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              '&:hover': { background: '#7B06C2' },
            }}
          >
            {isLoading ? 'Uploading...' : 'Upload Bulk File'}
          </ThemeButton>
          <ThemeButton
            variant="outlined"
            onClick={handleDownloadTemplateClick}
            sx={{
              borderColor: '#A409F8',
              color: '#A409F8',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              '&:hover': { borderColor: '#7B06C2', color: '#7B06C2' },
            }}
          >
            Download Sample CSV
          </ThemeButton>
          <ThemeButton
            variant="outlined"
            onClick={() => setHistoryOpen(true)}
            sx={{
              borderColor: '#A409F8',
              color: '#A409F8',
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              '&:hover': { borderColor: '#7B06C2', color: '#7B06C2' },
            }}
          >
            Import History
          </ThemeButton>
        </Stack>
      </Box>
      <ImportHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        module="productItem"
        title="Product Import History"
      />
    </CustomDialog>
  );
};

export default AddNewProductBulkDialog;