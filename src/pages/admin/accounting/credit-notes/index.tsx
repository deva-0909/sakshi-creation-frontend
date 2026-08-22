// Module 9: credit notes -- Draft -> Issued -> Cancelled. Issuing applies
// the note directly to its invoice (amount_paid/status update happens
// server-side, in issue_credit_note_transactional).
import React, { useEffect, useState } from "react";
import { Box, Typography, Stack, TableCell } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllInvoicesThunk } from "@/store/slices/invoiceSlice";
import {
  getAllCreditNotesThunk,
  createCreditNoteThunk,
  issueCreditNoteThunk,
  cancelCreditNoteThunk,
  clearCreditNoteError,
  clearCreditNoteSuccessMessage,
} from "@/store/slices/creditNoteSlice";
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

const OPEN_STATUSES = ["Issued", "Partially Paid", "Paid"];

const columns = [
  { id: "creditNoteNumber", label: "Credit Note #" },
  { id: "invoice", label: "Invoice" },
  { id: "party", label: "Party" },
  { id: "amount", label: "Amount" },
  { id: "status", label: "Status" },
  { id: "action", label: "Actions" },
];

const CreditNotesPage = () => {
  const dispatch = useAppDispatch();
  const { creditNotes, loading, error, successMessage } = useAppSelector((state) => state.creditNotes);
  const { invoices } = useAppSelector((state) => state.invoices);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.creditnote;

  const [createOpen, setCreateOpen] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    dispatch(getAllCreditNotesThunk(undefined));
    dispatch(getAllInvoicesThunk(undefined));
  }, [dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearCreditNoteSuccessMessage());
      setCreateOpen(false);
      setInvoice(null);
      setAmount("");
      setReason("");
      dispatch(getAllCreditNotesThunk(undefined));
    }
    if (error) {
      toast.error(error);
      dispatch(clearCreditNoteError());
    }
  }, [successMessage, error, dispatch]);

  const invoiceOptions = (invoices || [])
    .filter((inv) => OPEN_STATUSES.includes(inv.status) && inv.grandTotal - inv.amountPaid > 0)
    .map((inv) => ({ label: `${inv.invoiceNumber} (outstanding: ${inv.grandTotal - inv.amountPaid})`, value: inv._id }));

  const handleCreate = async () => {
    if (!invoice || !amount || Number(amount) <= 0) {
      toast.error("Select an invoice and enter a positive amount");
      return;
    }
    await dispatch(createCreditNoteThunk({ invoiceId: invoice.value, amount: Number(amount), reason: reason || undefined }));
  };

  const handleIssue = (id: string) => {
    dispatch(issueCreditNoteThunk(id))
      .unwrap()
      .then(() => toast.success("Credit note issued and applied to invoice"))
      .catch((err) => toast.error(err));
  };

  const handleCancel = (id: string) => {
    dispatch(cancelCreditNoteThunk(id))
      .unwrap()
      .then(() => toast.success("Credit note cancelled"))
      .catch((err) => toast.error(err));
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Credit Notes
        </Typography>
        {permissions?.create && (
          <ThemeButton onClick={() => setCreateOpen(true)} sx={{ background: "#175CD3" }}>
            New Credit Note
          </ThemeButton>
        )}
      </Box>

      <BasicTable
        tableHeader={columns}
        rowData={creditNotes.map((c) => ({ ...c, id: c._id }))}
        showDatePicker={false}
        showSearch={false}
        showFillter={false}
        renderRow={(row: any) => {
          const { bg, color } = statusColor(row.status);
          return (
            <>
              <TableCell>{row.creditNoteNumber}</TableCell>
              <TableCell>{row.invoice?.invoiceNumber || "-"}</TableCell>
              <TableCell>{row.party?.partyName || "-"}</TableCell>
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

      <CustomDialog open={createOpen} onClose={() => setCreateOpen(false)} title="New Credit Note" maxWidth="sm" fullWidth>
        <Box mb={2} mt={1}>
          <ThemeSelect label="Invoice" options={invoiceOptions} value={invoice} onChange={(_, v) => setInvoice(v)} required />
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

export default CreditNotesPage;
