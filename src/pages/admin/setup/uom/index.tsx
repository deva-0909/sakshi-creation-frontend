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
  getAllUomsThunk,
  createUomThunk,
  updateUomThunk,
  deleteUomThunk,
  clearUomError,
  clearUomSuccessMessage,
} from "@/store/slices/uomSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const STATUSES = ["Active", "Inactive"];
const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D1FADF", color: "#027A48" },
  Inactive: { bg: "#FEE4E2", color: "#B42318" },
};

interface UomForm {
  name: string;
  symbol: string;
  status: string;
}
const emptyForm: UomForm = { name: "", symbol: "", status: "Active" };

const columns = [
  { id: "id", label: "ID" },
  { id: "name", label: "Name" },
  { id: "symbol", label: "Symbol" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

const UomPage = () => {
  const dispatch = useAppDispatch();
  const { uoms, loading, error, successMessage } = useAppSelector((state) => state.uoms);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.uom;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<UomForm>(emptyForm);

  useEffect(() => {
    dispatch(getAllUomsThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearUomSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearUomError());
    }
  }, [successMessage, error, dispatch]);

  const handleOpenDialog = (uom?: any) => {
    if (uom) {
      setEditId(uom._id);
      setForm({ name: uom.name, symbol: uom.symbol || "", status: uom.status });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    const payload = { name: form.name, symbol: form.symbol || undefined, status: form.status };
    try {
      if (editId) {
        await dispatch(updateUomThunk({ id: editId, data: payload })).unwrap();
      } else {
        await dispatch(createUomThunk(payload)).unwrap();
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
        dispatch(deleteUomThunk(id));
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Units of Measure
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Used as a convenience picker on Bill of Materials and Material lines.
          </Typography>
        </Box>
        {permissions?.create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Unit
          </Button>
        )}
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={uoms.map((u: any) => ({ ...u, id: u._id }))}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.symbol || "-"}</TableCell>
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
                <IconButton color="error" onClick={() => handleDelete(row._id, row.name)}>
                  <Delete />
                </IconButton>
              )}
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Unit of Measure" : "New Unit of Measure"} maxWidth="xs" fullWidth>
        <Input labelName="Name" value={form.name} onChange={(e: any) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth required sx={{ mb: 2, mt: 1 }} />
        <Input labelName="Symbol (optional)" value={form.symbol} onChange={(e: any) => setForm((f) => ({ ...f, symbol: e.target.value }))} fullWidth sx={{ mb: 2 }} />
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

export default UomPage;
