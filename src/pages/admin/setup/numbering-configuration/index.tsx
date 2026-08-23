import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, TableCell, Checkbox, FormControlLabel } from "@mui/material";
import { Edit } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Button from "@/component/common_component/themebutton";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllNumberingConfigsThunk,
  updateNumberingConfigThunk,
  clearNumberingConfigError,
  clearNumberingConfigSuccessMessage,
} from "@/store/slices/numberingConfigSlice";
import { toast } from "react-toastify";

interface EditForm {
  prefix: string;
  separator: string;
  includeInitials: boolean;
  paddingWidth: string;
}
const emptyForm: EditForm = { prefix: "", separator: "-", includeInitials: false, paddingWidth: "" };

const columns = [
  { id: "id", label: "ID" },
  { id: "docType", label: "Document Type" },
  { id: "label", label: "Label" },
  { id: "prefix", label: "Prefix" },
  { id: "separator", label: "Separator" },
  { id: "includeInitials", label: "Includes Initials" },
  { id: "paddingWidth", label: "Padding" },
  { id: "action", label: "Actions" },
];

const csvColumns = [
  { id: "docType", label: "Document Type", value: (row: any) => row.docType },
  { id: "label", label: "Label", value: (row: any) => row.label },
  { id: "prefix", label: "Prefix", value: (row: any) => row.prefix || "-" },
  { id: "separator", label: "Separator", value: (row: any) => row.separator },
  { id: "includeInitials", label: "Includes Initials", value: (row: any) => (row.includeInitials ? "Yes" : "No") },
  { id: "paddingWidth", label: "Padding", value: (row: any) => row.paddingWidth ?? "-" },
];

// Module 10: docType and sequence_offset are intentionally not editable here --
// see numberingConfig.controller.js for why changing either would break the
// next_document_number() lookup or jump/repeat an already-issued document series.
const NumberingConfigurationPage = () => {
  const dispatch = useAppDispatch();
  const { configs, loading, error, successMessage } = useAppSelector((state) => state.numberingConfigs);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.numberingconfig;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [form, setForm] = useState<EditForm>(emptyForm);

  useEffect(() => {
    dispatch(getAllNumberingConfigsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearNumberingConfigSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearNumberingConfigError());
    }
  }, [successMessage, error, dispatch]);

  const handleOpenDialog = (config: any) => {
    setEditId(config._id);
    setEditLabel(config.label);
    setForm({
      prefix: config.prefix || "",
      separator: config.separator || "-",
      includeInitials: !!config.includeInitials,
      paddingWidth: config.paddingWidth != null ? String(config.paddingWidth) : "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editId) return;
    const payload = {
      prefix: form.prefix || null,
      separator: form.separator,
      includeInitials: form.includeInitials,
      paddingWidth: form.paddingWidth === "" ? null : Number(form.paddingWidth),
    };
    try {
      await dispatch(updateNumberingConfigThunk({ id: editId, data: payload })).unwrap();
      setDialogOpen(false);
      setEditId(null);
    } catch (err: any) {
      // error toast already handled by the effect above
    }
  };

  return (
    <Box p={3}>
      <Box mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Numbering Configuration
        </Typography>
        <Typography fontSize={14} color="text.secondary">
          Controls the prefix, separator, initials, and zero-padding used when each document type generates its next number. Document type and the underlying counter cannot be changed here.
        </Typography>
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={configs.map((c: any) => ({ ...c, id: c._id }))}
        csvColumns={csvColumns}
        exportFilename="numbering-configuration"
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.docType}</TableCell>
            <TableCell>{row.label}</TableCell>
            <TableCell>{row.prefix || "-"}</TableCell>
            <TableCell>{row.separator}</TableCell>
            <TableCell>{row.includeInitials ? "Yes" : "No"}</TableCell>
            <TableCell>{row.paddingWidth ?? "-"}</TableCell>
            <TableCell>
              {permissions?.edit && (
                <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                  <Edit />
                </IconButton>
              )}
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={`Edit Numbering -- ${editLabel}`} maxWidth="xs" fullWidth>
        <Input labelName="Prefix (optional)" value={form.prefix} onChange={(e: any) => setForm((f) => ({ ...f, prefix: e.target.value }))} fullWidth sx={{ mb: 2, mt: 1 }} />
        <Input labelName="Separator" value={form.separator} onChange={(e: any) => setForm((f) => ({ ...f, separator: e.target.value }))} fullWidth sx={{ mb: 2 }} />
        <FormControlLabel
          control={<Checkbox checked={form.includeInitials} onChange={(e) => setForm((f) => ({ ...f, includeInitials: e.target.checked }))} />}
          label="Include staff initials"
          sx={{ mb: 1 }}
        />
        <Input
          labelName="Padding Width (optional)"
          type="number"
          value={form.paddingWidth}
          onChange={(e: any) => setForm((f) => ({ ...f, paddingWidth: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
        />
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

export default NumberingConfigurationPage;
