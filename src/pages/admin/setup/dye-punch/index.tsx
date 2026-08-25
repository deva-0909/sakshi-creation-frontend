import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, TableCell } from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import CustomDialog from "@/component/customdialog";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllDyePunchesThunk,
  createDyePunchThunk,
  updateDyePunchThunk,
  deleteDyePunchThunk,
  clearDyePunchError,
  clearDyePunchSuccessMessage,
} from "@/store/slices/dyePunchSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Two-company Phase 2 Part A (claude/two-company-gap-analysis.md): Quality
// Packaging's die-cutting tooling register, from the Figma reference's
// "Dye / Punch" inventory tab. Standalone table/page (not a category inside
// the material-movement-ledger `inventories` table) -- see the design note
// in dyePunch.controller.js.
const TYPES = ["Regular", "Custom"];

interface DyePunchForm {
  dyePunchNumber: string;
  type: string;
  companyName: { label: string; value: string } | null;
  size: string;
  ply: string;
  sheetSize: string;
  boxSize: string;
  remarks: string;
}

const emptyForm: DyePunchForm = {
  dyePunchNumber: "",
  type: "Regular",
  companyName: null,
  size: "",
  ply: "",
  sheetSize: "",
  boxSize: "",
  remarks: "",
};

const columns = [
  { id: "id", label: "ID" },
  { id: "dyePunchNumber", label: "Dye/Punch No." },
  { id: "type", label: "Type" },
  { id: "size", label: "Size" },
  { id: "ply", label: "Ply" },
  { id: "sheetSize", label: "Sheet Size" },
  { id: "boxSize", label: "Box Size" },
  { id: "companyName", label: "Company" },
  { id: "action", label: "Actions" },
];

const csvColumns = [
  { id: "dyePunchNumber", label: "Dye/Punch No.", value: (row: any) => row.dyePunchNumber },
  { id: "type", label: "Type", value: (row: any) => row.type },
  { id: "size", label: "Size", value: (row: any) => row.size || "-" },
  { id: "ply", label: "Ply", value: (row: any) => row.ply || "-" },
  { id: "sheetSize", label: "Sheet Size", value: (row: any) => row.sheetSize || "-" },
  { id: "boxSize", label: "Box Size", value: (row: any) => row.boxSize || "-" },
  { id: "companyName", label: "Company", value: (row: any) => row.companyName?.companyName || "-" },
];

const DyePunchPage = () => {
  const dispatch = useAppDispatch();
  const { dyePunches, loading, error, successMessage } = useAppSelector((state) => state.dyePunches);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.dye_punch;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<DyePunchForm>(emptyForm);

  useEffect(() => {
    dispatch(getAllDyePunchesThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearDyePunchSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearDyePunchError());
    }
  }, [successMessage, error, dispatch]);

  const handleOpenDialog = (dyePunch?: any) => {
    if (dyePunch) {
      setEditId(dyePunch._id);
      setForm({
        dyePunchNumber: dyePunch.dyePunchNumber,
        type: dyePunch.type || "Regular",
        companyName: dyePunch.companyName ? { label: dyePunch.companyName.companyName, value: dyePunch.companyName._id } : null,
        size: dyePunch.size || "",
        ply: dyePunch.ply || "",
        sheetSize: dyePunch.sheetSize || "",
        boxSize: dyePunch.boxSize || "",
        remarks: dyePunch.remarks || "",
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.dyePunchNumber.trim()) {
      toast.error("Dye/Punch number is required");
      return;
    }

    const payload = {
      dyePunchNumber: form.dyePunchNumber,
      type: form.type || undefined,
      companyName: form.companyName?.value || undefined,
      size: form.size || undefined,
      ply: form.ply || undefined,
      sheetSize: form.sheetSize || undefined,
      boxSize: form.boxSize || undefined,
      remarks: form.remarks || undefined,
    };

    try {
      if (editId) {
        await dispatch(updateDyePunchThunk({ id: editId, data: payload })).unwrap();
      } else {
        await dispatch(createDyePunchThunk(payload)).unwrap();
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
        dispatch(deleteDyePunchThunk(id));
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Dye / Punch
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Die-cutting tooling register -- dye and punch numbers, size, ply, and sheet/box dimensions.
          </Typography>
        </Box>
        {permissions?.create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Dye/Punch
          </Button>
        )}
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={dyePunches.map((d: any) => ({ ...d, id: d._id }))}
        csvColumns={csvColumns}
        exportFilename="dye-punches"
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.dyePunchNumber}</TableCell>
            <TableCell>{row.type}</TableCell>
            <TableCell>{row.size || "-"}</TableCell>
            <TableCell>{row.ply || "-"}</TableCell>
            <TableCell>{row.sheetSize || "-"}</TableCell>
            <TableCell>{row.boxSize || "-"}</TableCell>
            <TableCell>{row.companyName?.companyName || "-"}</TableCell>
            <TableCell>
              {permissions?.edit && (
                <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                  <Edit />
                </IconButton>
              )}
              {permissions?.delete && (
                <IconButton color="error" onClick={() => handleDelete(row._id, row.dyePunchNumber)}>
                  <Delete />
                </IconButton>
              )}
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Dye/Punch" : "New Dye/Punch"} maxWidth="xs" fullWidth>
        <Input
          labelName="Dye/Punch Number"
          value={form.dyePunchNumber}
          onChange={(e: any) => setForm((f) => ({ ...f, dyePunchNumber: e.target.value }))}
          fullWidth
          required
          sx={{ mb: 2, mt: 1 }}
        />
        <Box mb={2}>
          <Select
            label="Type"
            options={TYPES.map((t) => ({ label: t, value: t }))}
            value={form.type ? { label: form.type, value: form.type } : null}
            onChange={(_, v) => setForm((f) => ({ ...f, type: v ? String(v.value) : "Regular" }))}
          />
        </Box>
        <Box mb={2}>
          <CompanySelect
            label="Company"
            name="companyName"
            value={form.companyName}
            onChange={(_, v) => setForm((f) => ({ ...f, companyName: v }))}
          />
        </Box>
        <Input
          labelName="Size (optional)"
          value={form.size}
          onChange={(e: any) => setForm((f) => ({ ...f, size: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Ply (optional)"
          value={form.ply}
          onChange={(e: any) => setForm((f) => ({ ...f, ply: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Sheet Size (optional)"
          value={form.sheetSize}
          onChange={(e: any) => setForm((f) => ({ ...f, sheetSize: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Box Size (optional)"
          value={form.boxSize}
          onChange={(e: any) => setForm((f) => ({ ...f, boxSize: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Remarks (optional)"
          value={form.remarks}
          onChange={(e: any) => setForm((f) => ({ ...f, remarks: e.target.value }))}
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

export default DyePunchPage;
