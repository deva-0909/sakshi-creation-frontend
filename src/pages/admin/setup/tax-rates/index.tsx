import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, TableCell, Checkbox, FormControlLabel } from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllTaxRatesThunk,
  createTaxRateThunk,
  updateTaxRateThunk,
  deleteTaxRateThunk,
  clearTaxRateError,
  clearTaxRateSuccessMessage,
} from "@/store/slices/taxRateSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const STATUSES = ["Active", "Inactive"];
const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D1FADF", color: "#027A48" },
  Inactive: { bg: "#FEE4E2", color: "#B42318" },
};

interface TaxRateForm {
  name: string;
  ratePercent: string;
  isDefault: boolean;
  status: string;
}
const emptyForm: TaxRateForm = { name: "", ratePercent: "", isDefault: false, status: "Active" };

const columns = [
  { id: "id", label: "ID" },
  { id: "name", label: "Name" },
  { id: "ratePercent", label: "Rate %" },
  { id: "isDefault", label: "Default" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

// Module 10: convenience picker for invoice/quotation GST line entry only --
// not enforced. Invoice/quotation validators still accept any non-negative
// numeric rate.
const TaxRatePage = () => {
  const dispatch = useAppDispatch();
  const { taxRates, loading, error, successMessage } = useAppSelector((state) => state.taxRates);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.taxrate;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<TaxRateForm>(emptyForm);

  useEffect(() => {
    dispatch(getAllTaxRatesThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearTaxRateSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearTaxRateError());
    }
  }, [successMessage, error, dispatch]);

  const handleOpenDialog = (taxRate?: any) => {
    if (taxRate) {
      setEditId(taxRate._id);
      setForm({ name: taxRate.name, ratePercent: String(taxRate.ratePercent), isDefault: !!taxRate.isDefault, status: taxRate.status });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.ratePercent === "" || Number(form.ratePercent) < 0) {
      toast.error("Name and a non-negative rate are required");
      return;
    }
    const payload = { name: form.name, ratePercent: Number(form.ratePercent), isDefault: form.isDefault, status: form.status };
    try {
      if (editId) {
        await dispatch(updateTaxRateThunk({ id: editId, data: payload })).unwrap();
      } else {
        await dispatch(createTaxRateThunk(payload)).unwrap();
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
        dispatch(deleteTaxRateThunk(id));
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Tax Rates
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            A convenience picker for invoice and quotation GST lines -- rates are still freely typed, not enforced.
          </Typography>
        </Box>
        {permissions?.create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Tax Rate
          </Button>
        )}
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={taxRates.map((t: any) => ({ ...t, id: t._id }))}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.ratePercent}%</TableCell>
            <TableCell>{row.isDefault ? "Yes" : "-"}</TableCell>
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

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Tax Rate" : "New Tax Rate"} maxWidth="xs" fullWidth>
        <Input labelName="Name" value={form.name} onChange={(e: any) => setForm((f) => ({ ...f, name: e.target.value }))} fullWidth required sx={{ mb: 2, mt: 1 }} />
        <Input
          labelName="Rate %"
          type="number"
          value={form.ratePercent}
          onChange={(e: any) => setForm((f) => ({ ...f, ratePercent: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <FormControlLabel
          control={<Checkbox checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />}
          label="Default rate"
          sx={{ mb: 1 }}
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

export default TaxRatePage;
