import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, TableCell } from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllDesignationsThunk,
  createDesignationThunk,
  updateDesignationThunk,
  deleteDesignationThunk,
  clearDesignationError,
  clearDesignationSuccessMessage,
} from "@/store/slices/designationSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const STATUSES = ["Active", "Inactive"];
const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D1FADF", color: "#027A48" },
  Inactive: { bg: "#FEE4E2", color: "#B42318" },
};

interface DesignationForm {
  designationName: string;
  status: string;
}
const emptyForm: DesignationForm = { designationName: "", status: "Active" };

const columns = [
  { id: "id", label: "ID" },
  { id: "designationName", label: "Designation" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

const csvColumns = [
  { id: "designationName", label: "Designation", value: (row: any) => row.designationName },
  { id: "status", label: "Status", value: (row: any) => row.status },
];

const DesignationPage = () => {
  const dispatch = useAppDispatch();
  const { designations, loading, error, successMessage } = useAppSelector((state) => state.designations);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.designation;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<DesignationForm>(emptyForm);

  useEffect(() => {
    dispatch(getAllDesignationsThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearDesignationSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearDesignationError());
    }
  }, [successMessage, error, dispatch]);

  const handleOpenDialog = (designation?: any) => {
    if (designation) {
      setEditId(designation._id);
      setForm({ designationName: designation.designationName, status: designation.status });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.designationName.trim()) {
      toast.error("Designation name is required");
      return;
    }
    const payload = { designationName: form.designationName, status: form.status };
    try {
      if (editId) {
        await dispatch(updateDesignationThunk({ id: editId, data: payload })).unwrap();
      } else {
        await dispatch(createDesignationThunk(payload)).unwrap();
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    } catch (err: any) {
      // error toast already handled by the effect above
    }
  };

  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${name}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteDesignationThunk(id));
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Designations
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Job titles assignable to staff.
          </Typography>
        </Box>
        {permissions?.create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#7F56D9", "&:hover": { background: "#53389E" } }}
          >
            New Designation
          </Button>
        )}
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={designations.map((d: any) => ({ ...d, id: d._id }))}
        csvColumns={csvColumns}
        exportFilename="designations"
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.designationName}</TableCell>
            <TableCell>
              <ThemeChip label={row.status} sx={{ background: statusColor[row.status]?.bg, color: statusColor[row.status]?.color, fontWeight: 600 }} />
            </TableCell>
            <TableCell>
              {permissions?.edit && (
                <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                  <Edit />
                </IconButton>
              )}
              {permissions?.delete && (
                <IconButton color="error" onClick={() => handleDelete(row._id, row.designationName)}>
                  <Delete />
                </IconButton>
              )}
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Designation" : "New Designation"} maxWidth="xs" fullWidth>
        <Input
          labelName="Designation Name"
          value={form.designationName}
          onChange={(e: any) => setForm((f) => ({ ...f, designationName: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2, mt: 1 }}
        />
        <Box mb={2}>
          <Select
            label="Status"
            options={STATUSES.map((s) => ({ label: s, value: s }))}
            value={form.status ? { label: form.status, value: form.status } : null}
            onChange={(_, v) => setForm((f) => ({ ...f, status: v ? String(v.value) : "Active" }))}
          />
        </Box>
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, borderColor: "#7F56D9", color: "#7F56D9", "&:hover": { borderColor: "#53389E", color: "#53389E" } }}>
            Close
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2, background: "#7F56D9", "&:hover": { background: "#53389E" } }} disabled={loading}>
            Save
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default DesignationPage;
