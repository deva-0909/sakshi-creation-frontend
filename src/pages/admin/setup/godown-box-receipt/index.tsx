import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, TableCell } from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import ThemeTabs, { TabItem } from "@/component/common_component/themetabs";
import CustomDialog from "@/component/customdialog";
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getAllGodownBoxReceiptsThunk,
  createGodownBoxReceiptThunk,
  updateGodownBoxReceiptThunk,
  deleteGodownBoxReceiptThunk,
  clearGodownBoxReceiptError,
  clearGodownBoxReceiptSuccessMessage,
} from "@/store/slices/godownBoxReceiptSlice";
import { getAllOrdersThunk } from "@/store/slices/orderSlice";
import { getAllVendorsThunk } from "@/store/slices/vendorSlice";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

// Full Figma slide scan Phase 8 (Theme 7, Slides 74-75, deferred since
// Phase 4): Godown's box/cartoon receiving manifest -- a receiving record
// (Box/Cartoon label, size, GSM, order, receipt date/pcs, vendor), not a
// material movement, so it's its own table/module rather than an
// `inventories` category (same reasoning dye_punches used). Standalone
// Setup page, also reused directly as the Inventory > Godown tab's content
// -- same dual-surface pattern as Dye/Punch.

enum WardTab {
  INWARD = "inward",
  OUTWARD = "outward",
}

const wardTabs: TabItem[] = [
  { label: "Inward", value: WardTab.INWARD },
  { label: "Outward", value: WardTab.OUTWARD },
];

interface ReceiptForm {
  boxLabel: string;
  boxType: string;
  size: string;
  qty: string;
  gsm: string;
  dateOfOrder: string;
  order: { label: string; value: string } | null;
  receivedDate: string;
  receivedPcs: string;
  vendor: { label: string; value: string } | null;
  companyName: { label: string; value: string } | null;
}

const emptyForm: ReceiptForm = {
  boxLabel: "",
  boxType: "",
  size: "",
  qty: "",
  gsm: "",
  dateOfOrder: "",
  order: null,
  receivedDate: "",
  receivedPcs: "",
  vendor: null,
  companyName: null,
};

const columns = [
  { id: "id", label: "ID" },
  { id: "boxLabel", label: "Box" },
  { id: "boxType", label: "Type" },
  { id: "size", label: "Size" },
  { id: "qty", label: "Qty" },
  { id: "gsm", label: "GSM" },
  { id: "dateOfOrder", label: "Dt Of Order" },
  { id: "orderNo", label: "Order No" },
  { id: "receivedDate", label: "Received Dt" },
  { id: "receivedPcs", label: "Received Pcs" },
  { id: "vendor", label: "Vendor" },
  { id: "action", label: "Actions" },
];

const csvColumns = [
  { id: "boxLabel", label: "Box", value: (row: any) => row.boxLabel },
  { id: "boxType", label: "Type", value: (row: any) => row.boxType || "-" },
  { id: "size", label: "Size", value: (row: any) => row.size || "-" },
  { id: "qty", label: "Qty", value: (row: any) => row.qty ?? "-" },
  { id: "gsm", label: "GSM", value: (row: any) => row.gsm ?? "-" },
  { id: "dateOfOrder", label: "Dt Of Order", value: (row: any) => row.dateOfOrder || "-" },
  { id: "orderNo", label: "Order No", value: (row: any) => row.order?.orderNumber || "-" },
  { id: "receivedDate", label: "Received Dt", value: (row: any) => row.receivedDate || "-" },
  { id: "receivedPcs", label: "Received Pcs", value: (row: any) => row.receivedPcs ?? "-" },
  { id: "vendor", label: "Vendor", value: (row: any) => row.vendor?.name || "-" },
];

const GodownBoxReceiptPage = () => {
  const dispatch = useAppDispatch();
  const { receipts, loading, error, successMessage } = useAppSelector((state) => state.godownBoxReceipts);
  const { orders } = useAppSelector((state) => state.orders);
  const { vendors } = useAppSelector((state) => state.vendors);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.godown_box_receipt;
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  const [activeWardTab, setActiveWardTab] = useState<WardTab>(WardTab.INWARD);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ReceiptForm>(emptyForm);

  useEffect(() => {
    dispatch(getAllOrdersThunk({ limit: 1000 }));
    dispatch(getAllVendorsThunk());
  }, [dispatch]);

  useEffect(() => {
    dispatch(getAllGodownBoxReceiptsThunk({ type: activeWardTab, ...(activeCompanyId ? { companyName: activeCompanyId } : {}) }));
  }, [dispatch, activeWardTab, activeCompanyId]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearGodownBoxReceiptSuccessMessage());
      dispatch(getAllGodownBoxReceiptsThunk({ type: activeWardTab, ...(activeCompanyId ? { companyName: activeCompanyId } : {}) }));
    }
    if (error) {
      toast.error(error);
      dispatch(clearGodownBoxReceiptError());
    }
  }, [successMessage, error, dispatch, activeWardTab, activeCompanyId]);

  const orderOptions = orders.map((o) => ({ label: o.orderNumber, value: o._id }));
  const vendorOptions = vendors.map((v: any) => ({ label: v.name, value: v._id }));

  const handleOpenDialog = (receipt?: any) => {
    if (receipt) {
      setEditId(receipt._id);
      setForm({
        boxLabel: receipt.boxLabel,
        boxType: receipt.boxType || "",
        size: receipt.size || "",
        qty: receipt.qty !== undefined && receipt.qty !== null ? String(receipt.qty) : "",
        gsm: receipt.gsm !== undefined && receipt.gsm !== null ? String(receipt.gsm) : "",
        dateOfOrder: receipt.dateOfOrder || "",
        order: receipt.order ? { label: receipt.order.orderNumber, value: receipt.order._id } : null,
        receivedDate: receipt.receivedDate || "",
        receivedPcs: receipt.receivedPcs !== undefined && receipt.receivedPcs !== null ? String(receipt.receivedPcs) : "",
        vendor: receipt.vendor ? { label: receipt.vendor.name, value: receipt.vendor._id } : null,
        companyName: receipt.companyName ? { label: receipt.companyName.companyName, value: receipt.companyName._id } : null,
      });
    } else {
      setEditId(null);
      setForm(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.boxLabel.trim()) {
      toast.error("Box/Cartoon label is required");
      return;
    }

    if ((form.qty && Number(form.qty) < 0) || (form.gsm && Number(form.gsm) < 0) || (form.receivedPcs && Number(form.receivedPcs) < 0)) {
      toast.error("Qty, GSM, and Received Pcs cannot be negative");
      return;
    }

    const payload = {
      boxLabel: form.boxLabel,
      boxType: form.boxType || undefined,
      size: form.size || undefined,
      qty: form.qty ? Number(form.qty) : undefined,
      gsm: form.gsm ? Number(form.gsm) : undefined,
      dateOfOrder: form.dateOfOrder || undefined,
      order: form.order?.value || undefined,
      receivedDate: form.receivedDate || undefined,
      receivedPcs: form.receivedPcs ? Number(form.receivedPcs) : undefined,
      vendor: form.vendor?.value || undefined,
      companyName: form.companyName?.value || undefined,
      type: activeWardTab,
    };

    try {
      if (editId) {
        await dispatch(updateGodownBoxReceiptThunk({ id: editId, data: payload })).unwrap();
      } else {
        await dispatch(createGodownBoxReceiptThunk(payload)).unwrap();
      }
      setDialogOpen(false);
      setForm(emptyForm);
      setEditId(null);
    } catch (err: any) {
      // error toast already handled by the effect above
    }
  };

  const handleDelete = (id: string, label: string) => {
    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete ${label}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteGodownBoxReceiptThunk(id));
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Godown Box/Cartoon Receiving
          </Typography>
          <Typography fontSize={14} color="text.secondary">
            Box/cartoon receiving manifest -- label, size, GSM, order, receipt date/pcs, and vendor.
          </Typography>
        </Box>
        {permissions?.create && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, background: "#7F56D9", "&:hover": { background: "#53389E" } }}
          >
            New Receipt
          </Button>
        )}
      </Box>

      <Box mb={2}>
        <ThemeTabs value={activeWardTab} onChange={(_, v) => setActiveWardTab(v as WardTab)} tabs={wardTabs} />
      </Box>

      <BasicTable
        tableHeader={columns}
        rowData={receipts.map((r: any) => ({ ...r, id: r._id }))}
        csvColumns={csvColumns}
        exportFilename="godown-box-receipts"
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.boxLabel}</TableCell>
            <TableCell>{row.boxType || "-"}</TableCell>
            <TableCell>{row.size || "-"}</TableCell>
            <TableCell>{row.qty ?? "-"}</TableCell>
            <TableCell>{row.gsm ?? "-"}</TableCell>
            <TableCell>{row.dateOfOrder ? new Date(row.dateOfOrder).toLocaleDateString() : "-"}</TableCell>
            <TableCell>{row.order?.orderNumber || "-"}</TableCell>
            <TableCell>{row.receivedDate ? new Date(row.receivedDate).toLocaleDateString() : "-"}</TableCell>
            <TableCell>{row.receivedPcs ?? "-"}</TableCell>
            <TableCell>{row.vendor?.name || "-"}</TableCell>
            <TableCell>
              {permissions?.edit && (
                <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                  <Edit />
                </IconButton>
              )}
              {permissions?.delete && (
                <IconButton color="error" onClick={() => handleDelete(row._id, row.boxLabel)}>
                  <Delete />
                </IconButton>
              )}
            </TableCell>
          </>
        )}
      />

      <CustomDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editId ? "Edit Receipt" : `New ${activeWardTab === WardTab.OUTWARD ? "Outward" : "Inward"} Receipt`} maxWidth="xs" fullWidth>
        <Input
          labelName="Box / Cartoon Label"
          value={form.boxLabel}
          onChange={(e: any) => setForm((f) => ({ ...f, boxLabel: e.target.value }))}
          fullWidth
          required
          placeholder="e.g. BOX 1, CARTOON"
          sx={{ mb: 2, mt: 1 }}
        />
        <Input
          labelName="Type (optional)"
          value={form.boxType}
          onChange={(e: any) => setForm((f) => ({ ...f, boxType: e.target.value }))}
          fullWidth
          placeholder="e.g. PLY WIRE BOX, PLY BOX"
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Size (optional)"
          value={form.size}
          onChange={(e: any) => setForm((f) => ({ ...f, size: e.target.value }))}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Qty (optional)"
          value={form.qty}
          onChange={(e: any) => setForm((f) => ({ ...f, qty: e.target.value }))}
          type="number"
          inputProps={{ min: 0 }}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Input
          labelName="GSM (optional)"
          value={form.gsm}
          onChange={(e: any) => setForm((f) => ({ ...f, gsm: e.target.value }))}
          type="number"
          inputProps={{ min: 0 }}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Date Of Order (optional)"
          value={form.dateOfOrder}
          onChange={(e: any) => setForm((f) => ({ ...f, dateOfOrder: e.target.value }))}
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        <Box mb={2}>
          <Select
            label="Order No (optional)"
            options={orderOptions}
            value={form.order}
            onChange={(_, v) => setForm((f) => ({ ...f, order: v ? { label: v.label, value: String(v.value) } : null }))}
          />
        </Box>
        <Input
          labelName="Received Date (optional)"
          value={form.receivedDate}
          onChange={(e: any) => setForm((f) => ({ ...f, receivedDate: e.target.value }))}
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Received Pcs (optional)"
          value={form.receivedPcs}
          onChange={(e: any) => setForm((f) => ({ ...f, receivedPcs: e.target.value }))}
          type="number"
          inputProps={{ min: 0 }}
          fullWidth
          sx={{ mb: 2 }}
        />
        <Box mb={2}>
          <Select
            label="Vendor (optional)"
            options={vendorOptions}
            value={form.vendor}
            onChange={(_, v) => setForm((f) => ({ ...f, vendor: v ? { label: v.label, value: String(v.value) } : null }))}
          />
        </Box>
        <Box mb={2}>
          <CompanySelect
            label="Company (optional)"
            name="companyName"
            value={form.companyName}
            onChange={(_, v) => setForm((f) => ({ ...f, companyName: v }))}
          />
        </Box>
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: "#7F56D9", color: "#7F56D9", "&:hover": { borderColor: "#53389E", color: "#53389E" } }}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ borderRadius: 2, background: "#7F56D9", "&:hover": { background: "#53389E" } }}
            disabled={loading}
          >
            Save
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default GodownBoxReceiptPage;
