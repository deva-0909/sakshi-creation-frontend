import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, TableCell } from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import CustomDialog from "@/component/customdialog";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllBranchesThunk,
  createBranchThunk,
  updateBranchThunk,
  deleteBranchThunk,
  clearBranchError,
  clearBranchSuccessMessage,
} from "@/store/slices/branchSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const STATUSES = ["Active", "Inactive"];
const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D1FADF", color: "#027A48" },
  Inactive: { bg: "#FEE4E2", color: "#B42318" },
};

interface BranchForm {
  branchName: string;
  companyName: string;
  address: string;
  status: string;
}
const emptyForm: BranchForm = { branchName: "", companyName: "", address: "", status: "Active" };

const columns = [
  { id: "id", label: "ID" },
  { id: "branchName", label: "Branch Name" },
  { id: "companyName", label: "Company" },
  { id: "address", label: "Address" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

const csvColumns = [
  { id: "branchName", label: "Branch Name", value: (row: any) => row.branchName },
  { id: "companyName", label: "Company", value: (row: any) => row.companyName?.companyName || "-" },
  { id: "address", label: "Address", value: (row: any) => row.address || "-" },
  { id: "status", label: "Status", value: (row: any) => row.status },
];

const BranchPage = () => {
  const dispatch = useAppDispatch();
  const { branches, loading, error, successMessage } = useAppSelector((state) => state.branches);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.branch;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<BranchForm>(emptyForm);

  useEffect(() => {
    dispatch(getAllBranchesThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearBranchSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearBranchError());
    }
  }, [successMessage, error, dispatch]);

  const handleOpenDialog = (branch?: any) => {
    if (branch) {
      setEditId(branch._id);
      setForm({
        branchName: branch.branchName,
        companyName: branch.companyName?._id || "",
        address: branch.address || "",
        status: branch.status,
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.branchName.trim()) {
      toast.error("Branch name is required");
      return;
    }
    const payload = {
      branchName: form.branchName,
      companyName: form.companyName || undefined,
      address: form.address || undefined,
      status: form.status,
    };
    try {
      if (editId) {
        await dispatch(updateBranchThunk({ id: editId, data: payload })).unwrap();
      } else {
        await dispatch(createBranchThunk(payload)).unwrap();
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
        dispatch(deleteBranchThunk(id));
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Branches
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Physical locations, optionally linked to a company, assignable to staff.
          </Typography>
        </Box>
        {permissions?.create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Branch
          </Button>
        )}
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={branches.map((b: any) => ({ ...b, id: b._id }))}
        csvColumns={csvColumns}
        exportFilename="branches"
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.branchName}</TableCell>
            <TableCell>{row.companyName?.companyName || "-"}</TableCell>
            <TableCell>{row.address || "-"}</TableCell>
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
                <IconButton color="error" onClick={() => handleDelete(row._id, row.branchName)}>
                  <Delete />
                </IconButton>
              )}
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Branch" : "New Branch"} maxWidth="xs" fullWidth>
        <Input
          labelName="Branch Name"
          value={form.branchName}
          onChange={(e: any) => setForm((f) => ({ ...f, branchName: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2, mt: 1 }}
        />
        <Box mb={2}>
          <CompanySelect
            label="Company (optional)"
            name="companyName"
            value={form.companyName}
            onChange={(_, v) => setForm((f) => ({ ...f, companyName: v }))}
          />
        </Box>
        <Input
          labelName="Address (optional)"
          value={form.address}
          onChange={(e: any) => setForm((f) => ({ ...f, address: e.target.value }))}
          fullWidth
          multiline
          rows={2}
          sx={{ mb: 2 }}
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
          <Button onClick={() => setDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2, borderColor: "#A409F8", color: "#A409F8", "&:hover": { borderColor: "#7B06C2", color: "#7B06C2" } }}>
            Close
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2, background: "#A409F8", "&:hover": { background: "#7B06C2" } }} disabled={loading}>
            Save
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default BranchPage;
