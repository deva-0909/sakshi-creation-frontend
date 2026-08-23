// Module 9: debit notes -- Draft -> Issued -> Cancelled. Issuing is a plain
// status flip (purchase orders have no amount_paid to write back to); the
// vendor ledger query picks up Issued debit notes as a credit line.
import React, { useEffect, useState } from "react";
import { Box, Typography, Stack, TableCell } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllVendorsThunk } from "@/store/slices/vendorSlice";
import { getAllPurchaseOrdersThunk } from "@/store/slices/purchaseOrderSlice";
import {
  getAllDebitNotesThunk,
  createDebitNoteThunk,
  issueDebitNoteThunk,
  cancelDebitNoteThunk,
  clearDebitNoteError,
  clearDebitNoteSuccessMessage,
} from "@/store/slices/debitNoteSlice";
import { toast } from "react-toastify";

const statusColor = (status: string): { bg: string; color: string } => {
  switch (status) {
    case "Draft":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Issued":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

const columns = [
  { id: "debitNoteNumber", label: "Debit Note #" },
  { id: "purchaseOrder", label: "Purchase Order" },
  { id: "vendor", label: "Vendor" },
  { id: "amount", label: "Amount" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

const csvColumns = [
  { id: "debitNoteNumber", label: "Debit Note #", value: (row: any) => row.debitNoteNumber },
  { id: "purchaseOrder", label: "Purchase Order", value: (row: any) => row.purchaseOrder?.poNumber || "-" },
  { id: "vendor", label: "Vendor", value: (row: any) => row.vendor?.name || "-" },
  { id: "amount", label: "Amount", value: (row: any) => row.amount },
  { id: "status", label: "Status", value: (row: any) => row.status },
];

const DebitNotesPage = () => {
  const dispatch = useAppDispatch();
  const { debitNotes, loading, error, successMessage } = useAppSelector((state) => state.debitNotes);
  const { vendors } = useAppSelector((state) => state.vendors);
  const { purchaseOrders } = useAppSelector((state) => state.purchaseOrders);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.debitnote;

  const [createOpen, setCreateOpen] = useState(false);
  const [vendor, setVendor] = useState<any>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    dispatch(getAllDebitNotesThunk(undefined));
    dispatch(getAllVendorsThunk());
    dispatch(getAllPurchaseOrdersThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearDebitNoteSuccessMessage());
      setCreateOpen(false);
      setVendor(null);
      setPurchaseOrder(null);
      setAmount("");
      setReason("");
      dispatch(getAllDebitNotesThunk(undefined));
    }
    if (error) {
      toast.error(error);
      dispatch(clearDebitNoteError());
    }
  }, [successMessage, error, dispatch]);

  const vendorOptions = (vendors || []).map((v: any) => ({ label: v.name, value: v._id, companyId: v.companyName?._id }));
  const poOptions = (purchaseOrders || [])
    .filter((po: any) => !vendor || po.vendor?._id === vendor.value)
    .map((po: any) => ({ label: po.poNumber, value: po._id }));

  const handleCreate = async () => {
    if (!vendor || !amount || Number(amount) <= 0) {
      toast.error("Select a vendor and enter a positive amount");
      return;
    }
    if (!vendor.companyId) {
      toast.error("Could not determine this vendor's company");
      return;
    }
    await dispatch(
      createDebitNoteThunk({
        vendorId: vendor.value,
        purchaseOrderId: purchaseOrder?.value,
        companyName: vendor.companyId,
        amount: Number(amount),
        reason: reason || undefined,
      })
    );
  };

  const handleIssue = (id: string) => {
    dispatch(issueDebitNoteThunk(id))
      .unwrap()
      .then(() => toast.success("Debit note issued"))
      .catch((err) => toast.error(err));
  };

  const handleCancel = (id: string) => {
    dispatch(cancelDebitNoteThunk(id))
      .unwrap()
      .then(() => toast.success("Debit note cancelled"))
      .catch((err) => toast.error(err));
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Debit Notes
        </Typography>
        {permissions?.create && (
          <ThemeButton onClick={() => setCreateOpen(true)} sx={{ background: "#175CD3" }}>
            New Debit Note
          </ThemeButton>
        )}
      </Box>

      <BasicTable
        tableHeader={columns}
        rowData={debitNotes.map((d) => ({ ...d, id: d._id }))}
        showDatePicker={false}
        showSearch={false}
        showFillter={false}
        csvColumns={csvColumns}
        exportFilename="debit-notes"
        renderRow={(row: any) => {
          const { bg, color } = statusColor(row.status);
          return (
            <>
              <TableCell>{row.debitNoteNumber}</TableCell>
              <TableCell>{row.purchaseOrder?.poNumber || "-"}</TableCell>
              <TableCell>{row.vendor?.name || "-"}</TableCell>
              <TableCell>{row.amount}</TableCell>
              <TableCell>
                <ThemeChip label={row.status} sx={{ background: bg, color, fontWeight: 600 }} />
              </TableCell>
              <TableCell>
                {row.status === "Draft" && (
                  <Stack direction="row" spacing={1}>
                    {permissions?.approve && (
                      <ThemeButton size="small" onClick={() => handleIssue(row._id)} sx={{ background: "#12B76A" }}>
                        Issue
                      </ThemeButton>
                    )}
                    {permissions?.edit && (
                      <ThemeButton size="small" variant="outlined" sx={{ borderColor: "#D92D20", color: "#D92D20" }} onClick={() => handleCancel(row._id)}>
                        Cancel
                      </ThemeButton>
                    )}
                  </Stack>
                )}
              </TableCell>
            </>
          );
        }}
      />

      <CustomDialog open={createOpen} onClose={() => setCreateOpen(false)} title="New Debit Note" maxWidth="sm" fullWidth>
        <Box mb={2} mt={1}>
          <ThemeSelect
            label="Vendor"
            options={vendorOptions}
            value={vendor}
            onChange={(_, v) => {
              setVendor(v);
              setPurchaseOrder(null);
            }}
            required
          />
        </Box>
        <Box mb={2}>
          <ThemeSelect label="Purchase Order (optional)" options={poOptions} value={purchaseOrder} onChange={(_, v) => setPurchaseOrder(v)} />
        </Box>
        <Box mb={2}>
          <ThemeInput labelName="Amount" type="number" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </Box>
        <Box mb={2}>
          <ThemeInput labelName="Reason" fullWidth multiline minRows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Box>
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <ThemeButton variant="outlined" onClick={() => setCreateOpen(false)}>
            Close
          </ThemeButton>
          <ThemeButton onClick={handleCreate} disabled={loading} sx={{ background: "#175CD3" }}>
            Create Draft
          </ThemeButton>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default DebitNotesPage;
