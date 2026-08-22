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
  getAllMachinesThunk,
  createMachineThunk,
  updateMachineThunk,
  deleteMachineThunk,
  clearMachineError,
  clearMachineSuccessMessage,
} from "@/store/slices/machineSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const CATEGORIES = ["Printer", "Binder", "Booklet Binder"];
const STATUSES = ["Active", "Under Maintenance", "Inactive"];

const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D1FADF", color: "#027A48" },
  "Under Maintenance": { bg: "#FEF0C7", color: "#B54708" },
  Inactive: { bg: "#FEE4E2", color: "#B42318" },
};

interface MachineForm {
  machineName: string;
  machineCode: string;
  category: string;
  companyName: { label: string; value: string } | null;
  capacity: string;
  status: string;
  purchaseDate: string;
  notes: string;
}

const emptyForm: MachineForm = {
  machineName: "",
  machineCode: "",
  category: "",
  companyName: null,
  capacity: "",
  status: "Active",
  purchaseDate: "",
  notes: "",
};

const columns = [
  { id: "id", label: "ID" },
  { id: "machineName", label: "Machine Name" },
  { id: "machineCode", label: "Code" },
  { id: "category", label: "Category" },
  { id: "companyName", label: "Company" },
  { id: "capacity", label: "Capacity" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

const MachinePage = () => {
  const dispatch = useAppDispatch();
  const { machines, loading, error, successMessage } = useAppSelector((state) => state.machines);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.machine;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<MachineForm>(emptyForm);

  useEffect(() => {
    dispatch(getAllMachinesThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearMachineSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearMachineError());
    }
  }, [successMessage, error, dispatch]);

  const handleOpenDialog = (machine?: any) => {
    if (machine) {
      setEditId(machine._id);
      setForm({
        machineName: machine.machineName,
        machineCode: machine.machineCode,
        category: machine.category,
        companyName: machine.companyName ? { label: machine.companyName.companyName, value: machine.companyName._id } : null,
        capacity: machine.capacity || "",
        status: machine.status,
        purchaseDate: machine.purchaseDate || "",
        notes: machine.notes || "",
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.machineName.trim() || !form.machineCode.trim() || !form.category || !form.companyName) {
      toast.error("Machine name, code, category, and company are required");
      return;
    }

    const payload = {
      machineName: form.machineName,
      machineCode: form.machineCode,
      category: form.category as "Printer" | "Binder" | "Booklet Binder",
      companyName: form.companyName.value,
      capacity: form.capacity || undefined,
      status: form.status as "Active" | "Under Maintenance" | "Inactive",
      purchaseDate: form.purchaseDate || undefined,
      notes: form.notes || undefined,
    };

    try {
      if (editId) {
        await dispatch(updateMachineThunk({ id: editId, data: payload })).unwrap();
      } else {
        await dispatch(createMachineThunk(payload)).unwrap();
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
        dispatch(deleteMachineThunk(id));
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Machines
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Printer, Binder, and Booklet Binder equipment. Machine codes are unique within a company.
          </Typography>
        </Box>
        {permissions?.create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Machine
          </Button>
        )}
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={machines.map((m: any) => ({ ...m, id: m._id }))}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.machineName}</TableCell>
            <TableCell>{row.machineCode}</TableCell>
            <TableCell>{row.category}</TableCell>
            <TableCell>{row.companyName?.companyName || "-"}</TableCell>
            <TableCell>{row.capacity || "-"}</TableCell>
            <TableCell>
              <ThemeChip
                label={row.status}
                sx={{
                  background: statusColor[row.status]?.bg,
                  color: statusColor[row.status]?.color,
                  fontWeight: 600,
                }}
              />
            </TableCell>
            <TableCell>
              {permissions?.edit && (
                <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                  <Edit />
                </IconButton>
              )}
              {permissions?.delete && (
                <IconButton color="error" onClick={() => handleDelete(row._id, row.machineName)}>
                  <Delete />
                </IconButton>
              )}
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Machine" : "New Machine"} maxWidth="xs" fullWidth>
        <Input
          labelName="Machine Name"
          value={form.machineName}
          onChange={(e: any) => setForm((f) => ({ ...f, machineName: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2, mt: 1 }}
        />
        <Input
          labelName="Machine Code"
          value={form.machineCode}
          onChange={(e: any) => setForm((f) => ({ ...f, machineCode: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Box mb={2}>
          <Select
            label="Category"
            options={CATEGORIES.map((c) => ({ label: c, value: c }))}
            value={form.category ? { label: form.category, value: form.category } : null}
            onChange={(_, v) => setForm((f) => ({ ...f, category: v ? String(v.value) : "" }))}
            required
          />
        </Box>
        <Box mb={2}>
          <CompanySelect
            label="Company"
            name="companyName"
            value={form.companyName}
            onChange={(_, v) => setForm((f) => ({ ...f, companyName: v }))}
            required
          />
        </Box>
        <Input
          labelName="Capacity (optional)"
          value={form.capacity}
          onChange={(e: any) => setForm((f) => ({ ...f, capacity: e.target.value }))}
          fullWidth
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
        <Input
          labelName="Purchase Date (optional)"
          type="date"
          value={form.purchaseDate}
          onChange={(e: any) => setForm((f) => ({ ...f, purchaseDate: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
          InputLabelProps={{ shrink: true }}
        />
        <Input
          labelName="Notes (optional)"
          value={form.notes}
          onChange={(e: any) => setForm((f) => ({ ...f, notes: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: "#A409F8", color: "#A409F8", "&:hover": { borderColor: "#7B06C2", color: "#7B06C2" } }}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ borderRadius: 2, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
            disabled={loading}
          >
            Save
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default MachinePage;
