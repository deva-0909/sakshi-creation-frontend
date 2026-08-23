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
  getAllWarehousesThunk,
  createWarehouseThunk,
  updateWarehouseThunk,
  deleteWarehouseThunk,
  clearWarehouseError,
  clearWarehouseSuccessMessage,
} from "@/store/slices/warehouseSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Module 11 Part A: Warehouse master -- single-level (no rack/bin), the same
// shape as Branch/Machine (plain status column, optional company link).
const STATUSES = ["Active", "Inactive"];
const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D1FADF", color: "#027A48" },
  Inactive: { bg: "#FEE4E2", color: "#B42318" },
};

interface WarehouseForm {
  warehouseName: string;
  warehouseCode: string;
  companyName: string;
  address: string;
  status: string;
}
const emptyForm: WarehouseForm = { warehouseName: "", warehouseCode: "", companyName: "", address: "", status: "Active" };

const columns = [
  { id: "id", label: "ID" },
  { id: "warehouseName", label: "Warehouse Name" },
  { id: "warehouseCode", label: "Code" },
  { id: "companyName", label: "Company" },
  { id: "address", label: "Address" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

const csvColumns = [
  { id: "warehouseName", label: "Warehouse Name", value: (row: any) => row.warehouseName },
  { id: "warehouseCode", label: "Code", value: (row: any) => row.warehouseCode || "-" },
  { id: "companyName", label: "Company", value: (row: any) => row.companyName?.companyName || "-" },
  { id: "address", label: "Address", value: (row: any) => row.address || "-" },
  { id: "status", label: "Status", value: (row: any) => row.status },
];

const WarehousePage = () => {
  const dispatch = useAppDispatch();
  const { warehouses, loading, error, successMessage } = useAppSelector((state) => state.warehouses);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.warehouse;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<WarehouseForm>(emptyForm);

  useEffect(() => {
    dispatch(getAllWarehousesThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearWarehouseSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearWarehouseError());
    }
  }, [successMessage, error, dispatch]);

  const handleOpenDialog = (warehouse?: any) => {
    if (warehouse) {
      setEditId(warehouse._id);
      setForm({
        warehouseName: warehouse.warehouseName,
        warehouseCode: warehouse.warehouseCode || "",
        companyName: warehouse.companyName?._id || "",
        address: warehouse.address || "",
        status: warehouse.status,
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.warehouseName.trim()) {
      toast.error("Warehouse name is required");
      return;
    }
    const payload = {
      warehouseName: form.warehouseName,
      warehouseCode: form.warehouseCode || undefined,
      companyName: form.companyName || undefined,
      address: form.address || undefined,
      status: form.status,
    };
    try {
      if (editId) {
        await dispatch(updateWarehouseThunk({ id: editId, data: payload })).unwrap();
      } else {
        await dispatch(createWarehouseThunk(payload)).unwrap();
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
        dispatch(deleteWarehouseThunk(id));
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Warehouses
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Single-level physical storage locations, optionally linked to a company. Used by Stock Transfer, Stock
            Adjustment, and Stock Reservation.
          </Typography>
        </Box>
        {permissions?.create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Warehouse
          </Button>
        )}
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={warehouses.map((w: any) => ({ ...w, id: w._id }))}
        csvColumns={csvColumns}
        exportFilename="warehouses"
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.warehouseName}</TableCell>
            <TableCell>{row.warehouseCode || "-"}</TableCell>
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
                <IconButton color="error" onClick={() => handleDelete(row._id, row.warehouseName)}>
                  <Delete />
                </IconButton>
              )}
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Warehouse" : "New Warehouse"} maxWidth="xs" fullWidth>
        <Input
          labelName="Warehouse Name"
          value={form.warehouseName}
          onChange={(e: any) => setForm((f) => ({ ...f, warehouseName: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2, mt: 1 }}
        />
        <Input
          labelName="Warehouse Code (optional)"
          value={form.warehouseCode}
          onChange={(e: any) => setForm((f) => ({ ...f, warehouseCode: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
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

export default WarehousePage;
