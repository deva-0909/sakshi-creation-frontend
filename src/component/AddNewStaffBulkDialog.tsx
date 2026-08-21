"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, Stack } from "@mui/material";
import { toast } from "react-toastify";
import CustomDialog from "@/component/customdialog";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeSelect from "@/component/common_component/themeselect";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import ImportErrorsTable, { ImportRowError } from "@/component/bulkImport/ImportErrorsTable";
import ImportHistoryDialog from "@/component/bulkImport/ImportHistoryDialog";
import { downloadBulkTemplate } from "@/utils/downloadTemplate";
import Endpoint from "@/API/apiConfig";
import { useAppDispatch, useAppSelector } from "@/store";
import { bulkCreateStaffThunk, clearError, clearSuccessMessage } from "@/store/slices/staffSlice";
import { getAllRolesThunk } from "@/store/slices/roleSlice";

interface AddNewStaffBulkDialogProps {
  open: boolean;
  onClose: () => void;
  refreshData?: () => void;
}

interface RoleOption {
  label: string;
  value: string;
}

const AddNewStaffBulkDialog: React.FC<AddNewStaffBulkDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch();
  const { loading, error, successMessage } = useAppSelector((state) => state.staff);
  const { roles, loading: rolesLoading } = useAppSelector((state) => state.roles);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [importErrors, setImportErrors] = useState<ImportRowError[]>([]);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    dispatch(getAllRolesThunk());
  }, [dispatch]);

  useEffect(() => {
    if (roles.length > 0) {
      const options = roles.map((role) => ({
        label: role.roleName,
        value: role._id,
      }));
      setRoleOptions(options);
    }
  }, [roles]);

  useEffect(() => {
    if (open) {
      dispatch(clearError());
      dispatch(clearSuccessMessage());
      setFile(null);
      setSelectedRole(null);
      setCompanyName("");
      setImportErrors([]);
      setImportSuccessCount(0);
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearSuccessMessage());
    }
  }, [error, successMessage, dispatch]);

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please select a CSV file to upload");
      return;
    }
    if (!selectedRole) {
      toast.error("Please select a role");
      return;
    }
    if (!companyName) {
      toast.error("Please select a company");
      return;
    }

    setIsLoading(true);
    setImportErrors([]);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", selectedRole.value);
    formData.append("companyName", companyName);

    try {
      const result = await dispatch(bulkCreateStaffThunk(formData)).unwrap();
      const errors = result.errors || [];
      setImportErrors(errors);
      setImportSuccessCount(result.count || 0);
      if (refreshData) refreshData();
      setFile(null);
      setSelectedRole(null);
      setCompanyName("");
      // Keep the dialog open when some rows failed, so the user can see
      // which rows to fix; only close on a fully clean import.
      if (errors.length === 0) {
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Bulk upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplateClick = async () => {
    try {
      await downloadBulkTemplate(Endpoint.BULK_STAFF_TEMPLATE, "staff-bulk-import-template.csv");
    } catch (err: any) {
      toast.error(err.message || "Failed to download template");
    }
  };

  return (
    <CustomDialog open={open} maxWidth="md" onClose={onClose} title="Bulk Upload Staff">
      <Box sx={{ background: "#fff", borderRadius: 2, p: 3 }}>
        {/* Role and Company Selection */}
        <Stack direction="row" spacing={2} mb={3}>
          <Box sx={{ flex: 1 }}>
            <ThemeSelect
              label="Role"
              options={roleOptions}
              value={selectedRole}
              onChange={(event, newValue) => setSelectedRole(newValue as RoleOption | null)}
              error={!selectedRole && isLoading}
              helperText={!selectedRole && isLoading ? "Role is required" : ""}
              fullWidth
              required
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <CompanySelect
              name="companyName"
              value={companyName}
              onChange={(event, newValue) => {
                setCompanyName(newValue ? newValue.value : "");
              }}
              error={!companyName && isLoading}
              helperText={!companyName && isLoading ? "Company is required" : ""}
              required
            />
          </Box>
        </Stack>

        {/* CSV File Upload */}
        <Box mb={3}>
          <Typography fontWeight={500} fontSize={14} mb={1}>
            Upload CSV File
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1 }}>
            Ensure aadharNo is exactly 12 digits (e.g., 123456789012) and dates are in YYYY-MM-DD format (e.g., 2025-08-22). Download the sample CSV for reference.
          </Typography>
          <Box
            sx={{
              border: "2px dashed #e0e0e0",
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              backgroundColor: "#fafafa",
              transition: "all 0.3s ease",
              cursor: "pointer",
              "&:hover": {
                borderColor: "#7F56D9",
                backgroundColor: "#f5f5f5",
              },
              ...(file && {
                borderColor: "#4caf50",
                backgroundColor: "#f1f8e9",
              }),
            }}
            onClick={() => document.getElementById("bulk-staff-file-input")?.click()}
          >
            <input
              id="bulk-staff-file-input"
              type="file"
              accept=".csv"
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile && selectedFile.type === "text/csv") {
                  setFile(selectedFile);
                } else {
                  toast.error("Please select a valid CSV file");
                }
              }}
              style={{ display: "none" }}
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

        {/* Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end" flexWrap="wrap" useFlexGap>
          <ThemeButton
            variant="outlined"
            onClick={onClose}
            sx={{
              borderColor: "#7F56D9",
              color: "#7F56D9",
              "&:hover": { borderColor: "#5B3FB4", color: "#5B3FB4" },
            }}
          >
            {importErrors.length > 0 ? "Close" : "Cancel"}
          </ThemeButton>
          <ThemeButton
            disabled={!file || !selectedRole || !companyName || isLoading}
            onClick={handleSubmit}
            sx={{
              background: "#7F56D9",
              color: "#fff",
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              "&:hover": { background: "#5B3FB4" },
            }}
          >
            {isLoading ? "Uploading..." : "Upload Bulk File"}
          </ThemeButton>
          <ThemeButton
            variant="outlined"
            onClick={handleDownloadTemplateClick}
            sx={{
              borderColor: "#7F56D9",
              color: "#7F56D9",
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              "&:hover": { borderColor: "#5B3FB4", color: "#5B3FB4" },
            }}
          >
            Download Sample CSV
          </ThemeButton>
          <ThemeButton
            variant="outlined"
            onClick={() => setHistoryOpen(true)}
            sx={{
              borderColor: "#7F56D9",
              color: "#7F56D9",
              fontWeight: 600,
              fontSize: 16,
              borderRadius: 2,
              py: 1.2,
              "&:hover": { borderColor: "#5B3FB4", color: "#5B3FB4" },
            }}
          >
            Import History
          </ThemeButton>
        </Stack>
      </Box>
      <ImportHistoryDialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        module="staff"
        title="Staff Import History"
      />
    </CustomDialog>
  );
};

export default AddNewStaffBulkDialog;