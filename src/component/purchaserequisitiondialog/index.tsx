"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Box, Stack, IconButton, Typography } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import CustomDialog from "@/component/customdialog";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeButton from "@/component/common_component/themebutton";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";
import {
  createPurchaseRequisitionThunk,
  clearPurchaseRequisitionError,
  clearPurchaseRequisitionSuccessMessage,
} from "@/store/slices/purchaseRequisitionSlice";
import { toast } from "react-toastify";

interface OptionType {
  label: string;
  value: string;
}

interface LineItem {
  materialId: OptionType | null;
  quantityRequired: string;
  notes: string;
}

interface AddPurchaseRequisitionDialogProps {
  open: boolean;
  onClose: () => void;
  refreshData?: () => void;
}

const emptyItem: LineItem = { materialId: null, quantityRequired: "", notes: "" };

const AddPurchaseRequisitionDialog: React.FC<AddPurchaseRequisitionDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch();

  const { materials, loading: materialsLoading } = useAppSelector((state) => state.materials);
  const { loading, error, successMessage } = useAppSelector((state) => state.purchaseRequisitions);

  const [companyName, setCompanyName] = useState<OptionType | null>(null);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      dispatch(clearPurchaseRequisitionError());
      dispatch(clearPurchaseRequisitionSuccessMessage());
      dispatch(getAllMaterialsThunk());
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearPurchaseRequisitionSuccessMessage());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPurchaseRequisitionError());
    }
  }, [error, dispatch]);

  const materialOptions: OptionType[] = materials.map((m: any) => ({
    label: `${m.materialName}${m.materialSize ? ` - ${m.materialSize}` : ""}${m.materialGSM ? ` (${m.materialGSM}gsm)` : ""}`,
    value: m._id,
  }));

  const resetForm = () => {
    setCompanyName(null);
    setNotes("");
    setItems([{ ...emptyItem }]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const updateItem = (index: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const addItemRow = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!companyName) {
      toast.error("Select a company");
      return;
    }
    const validItems = items.filter((it) => it.materialId && Number(it.quantityRequired) > 0);
    if (validItems.length === 0) {
      toast.error("Add at least one material line item with a positive quantity");
      return;
    }

    setIsSubmitting(true);
    try {
      await dispatch(
        createPurchaseRequisitionThunk({
          companyName: companyName.value,
          notes: notes || undefined,
          items: validItems.map((it) => ({
            materialId: it.materialId!.value,
            quantityRequired: Number(it.quantityRequired),
            notes: it.notes || undefined,
          })),
        })
      ).unwrap();

      if (refreshData) refreshData();
      resetForm();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create purchase requisition");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="New Purchase Requisition">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Box mb={2}>
          <CompanySelect name="companyName" value={companyName} onChange={(_, v) => setCompanyName(v)} hasParties={false} required />
        </Box>

        <Typography fontWeight={600} fontSize={14} mb={1}>
          Materials Required
        </Typography>
        <Stack spacing={1.5} mb={2}>
          {items.map((item, index) => (
            <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
              <Box flex={2}>
                <ThemeSelect
                  label={index === 0 ? "Material" : undefined}
                  options={materialOptions}
                  value={item.materialId}
                  onChange={(_, v) => updateItem(index, { materialId: v as OptionType | null })}
                  disabled={materialsLoading}
                />
              </Box>
              <Box flex={1}>
                <ThemeInput
                  labelName={index === 0 ? "Qty Required" : undefined}
                  type="number"
                  fullWidth
                  value={item.quantityRequired}
                  onChange={(e) => updateItem(index, { quantityRequired: e.target.value })}
                />
              </Box>
              <Box flex={1.5}>
                <ThemeInput
                  labelName={index === 0 ? "Notes (optional)" : undefined}
                  fullWidth
                  value={item.notes}
                  onChange={(e) => updateItem(index, { notes: e.target.value })}
                />
              </Box>
              <IconButton onClick={() => removeItemRow(index)} disabled={items.length === 1} sx={{ mt: index === 0 ? 3.5 : 0 }}>
                <Delete fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          <ThemeButton variant="outlined" startIcon={<Add />} onClick={addItemRow} sx={{ alignSelf: "flex-start" }}>
            Add Line
          </ThemeButton>
        </Stack>

        <ThemeInput labelName="Notes" fullWidth multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mb: 2 }} />

        <ThemeButton
          onClick={handleSubmit}
          disabled={isSubmitting || loading}
          sx={{
            background: "#12B76A",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: "100%",
            mt: 1,
            "&:hover": { background: "#079455" },
          }}
        >
          {isSubmitting || loading ? "Creating..." : "Create Requisition (Draft)"}
        </ThemeButton>
      </Box>
    </CustomDialog>
  );
};

export default AddPurchaseRequisitionDialog;
