import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Stack,
  CircularProgress,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getInvoiceByIdThunk,
  getInvoiceHistoryThunk,
  issueInvoiceThunk,
  cancelInvoiceThunk,
  clearSingleInvoice,
  clearInvoiceError,
  clearInvoiceSuccessMessage,
} from "@/store/slices/invoiceSlice";
import { getAllReceiptsThunk, createReceiptThunk, clearReceiptError, clearReceiptSuccessMessage } from "@/store/slices/receiptSlice";
// Multi-role audit fix (Finding 8): issuing a credit note applies its amount
// directly against the invoice's amountPaid, same as a cash receipt does --
// so without this, a credit note and a real payment were visually
// indistinguishable here, and Accounts staff had no way to tell why a
// balance dropped with no receipt on file.
import { getAllCreditNotesThunk } from "@/store/slices/creditNoteSlice";
import { toast } from "react-toastify";
import { invoiceService } from "@/services/invoice.service";

const statusColor = (status: string): { bg: string; color: string } => {
  switch (status) {
    case "Draft":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Issued":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Partially Paid":
      return { bg: "#FEF0C7", color: "#B54708" };
    case "Paid":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

const RECEIVABLE_STATUSES = ["Issued", "Partially Paid"];
const MODES = ["Cash", "Bank Transfer", "UPI", "Cheque", "Other"];

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box display="flex" justifyContent="space-between" py={0.75} borderBottom="1px solid #F2F4F7">
    <Typography fontSize={14} color="#667085">
      {label}
    </Typography>
    <Typography fontSize={14} fontWeight={600} color="#101828">
      {value ?? "-"}
    </Typography>
  </Box>
);

const InvoiceDetailPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const { singleInvoice: inv, history, loading, error, successMessage } = useAppSelector((state) => state.invoices);
  const { receipts, loading: receiptLoading, error: receiptError, successMessage: receiptSuccessMessage } = useAppSelector(
    (state) => state.receipts
  );
  // Finding 8: separate "cash received" (receipts) from "credit applied"
  // (issued credit notes) instead of only ever showing their combined effect
  // on inv.amountPaid.
  const { creditNotes } = useAppSelector((state) => state.creditNotes);
  const { user } = useAppSelector((state) => state.auth);

  const permissions = user?.role?.permissions?.invoice;
  const receiptPermissions = user?.role?.permissions?.receipt;

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelRemarks, setCancelRemarks] = useState("");

  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<{ label: string; value: string | number } | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");

  const load = () => {
    if (typeof id === "string") {
      dispatch(getInvoiceByIdThunk(id));
      dispatch(getInvoiceHistoryThunk(id));
      dispatch(getAllReceiptsThunk({ invoiceId: id }));
      dispatch(getAllCreditNotesThunk({ invoiceId: id }));
    }
  };

  useEffect(() => {
    load();
    return () => {
      dispatch(clearSingleInvoice());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearInvoiceSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearInvoiceError());
    }
  }, [successMessage, error, dispatch]);

  useEffect(() => {
    if (receiptSuccessMessage) {
      toast.success(receiptSuccessMessage);
      dispatch(clearReceiptSuccessMessage());
      setAmount("");
      setMode(null);
      setReferenceNumber("");
      setReceiptNotes("");
      load();
    }
    if (receiptError) {
      toast.error(receiptError);
      dispatch(clearReceiptError());
    }
  }, [receiptSuccessMessage, receiptError, dispatch]);

  if (loading && !inv) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!inv) return null;

  const { bg, color } = statusColor(inv.status);
  const outstanding = inv.grandTotal - inv.amountPaid;
  // Finding 8: amountPaid is one blended number that a cash receipt and an
  // issued credit note both feed into identically -- break it back apart
  // for display so it's clear how much of it is real cash vs. a write-off.
  const issuedCreditNotes = creditNotes.filter((c) => c.status === "Issued");
  const creditApplied = issuedCreditNotes.reduce((sum, c) => sum + (c.amount || 0), 0);
  const cashReceived = inv.amountPaid - creditApplied;

  const handleDownloadPdf = async () => {
    try {
      const blob = await invoiceService.getInvoicePdf(inv._id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      toast.error(err?.message || "Failed to download invoice PDF");
    }
  };

  const handlePostReceipt = async () => {
    if (!amount || Number(amount) <= 0 || !mode) {
      toast.error("Enter a positive amount and select a payment mode");
      return;
    }
    if (!inv.party?._id) {
      toast.error("This invoice has no linked party");
      return;
    }
    await dispatch(
      createReceiptThunk({
        invoiceId: inv._id,
        partyId: inv.party._id,
        companyName: inv.companyName?._id || "",
        amount: Number(amount),
        paymentDate,
        mode: String(mode.value),
        referenceNumber: referenceNumber || undefined,
        notes: receiptNotes || undefined,
      })
    );
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight={600}>
            {inv.invoiceNumber}
          </Typography>
          <ThemeChip label={inv.status} sx={{ background: bg, color, fontWeight: 600 }} />
        </Box>
        <Stack direction="row" spacing={1.5}>
          <ThemeButton variant="outlined" onClick={handleDownloadPdf}>
            Download PDF
          </ThemeButton>
          <ThemeButton variant="outlined" onClick={() => router.push("/admin/accounting/invoices")}>
            Back to list
          </ThemeButton>
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 2 }}>
          <Typography fontWeight={600} mb={1}>
            Details
          </Typography>
          <DetailRow label="Company" value={inv.companyName?.companyName} />
          <DetailRow label="Party" value={inv.party?.partyName} />
          <DetailRow label="GST Type" value={inv.gstType === "CGST_SGST" ? "CGST + SGST" : inv.gstType} />
          <DetailRow label="Invoice Date" value={inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString() : "-"} />
          <DetailRow label="Due Date" value={inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"} />
          <DetailRow label="Notes" value={inv.notes} />
          <DetailRow
            label="Created By"
            value={inv.createdBy ? `${inv.createdBy.firstName} ${inv.createdBy.lastName}` : "-"}
          />

          <Divider sx={{ my: 2 }} />
          <Typography fontWeight={600} mb={1}>
            Line Items
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>HSN</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>GST %</TableCell>
                <TableCell>Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(inv.items || []).map((it) => (
                <TableRow key={it._id}>
                  <TableCell>{it.description}</TableCell>
                  <TableCell>{it.hsnCode || "-"}</TableCell>
                  <TableCell>{it.quantity}</TableCell>
                  <TableCell>{it.unitPrice}</TableCell>
                  <TableCell>{it.gstRate}</TableCell>
                  <TableCell>{it.lineTotal}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </Box>

          <Box sx={{ mt: 2, ml: "auto", maxWidth: 260 }}>
            <DetailRow label="Subtotal" value={inv.subtotal} />
            {inv.gstType === "CGST_SGST" && (
              <>
                <DetailRow label="CGST" value={inv.cgstAmount} />
                <DetailRow label="SGST" value={inv.sgstAmount} />
              </>
            )}
            {inv.gstType === "IGST" && <DetailRow label="IGST" value={inv.igstAmount} />}
            <DetailRow label="Grand Total" value={inv.grandTotal} />
            <DetailRow label="Amount Paid" value={inv.amountPaid} />
            {creditApplied > 0 && (
              <>
                <DetailRow label="— Cash Received" value={cashReceived} />
                <DetailRow label="— Credit Applied" value={creditApplied} />
              </>
            )}
            <DetailRow label="Outstanding" value={outstanding} />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
          <Typography fontWeight={600} mb={2}>
            Actions
          </Typography>
          <Stack spacing={1.5}>
            {inv.status === "Draft" && permissions?.edit && (
              <ThemeButton onClick={() => dispatch(issueInvoiceThunk(inv._id))} sx={{ background: "#175CD3" }}>
                Issue Invoice
              </ThemeButton>
            )}
            {["Draft", "Issued"].includes(inv.status) && permissions?.edit && (
              <ThemeButton
                variant="outlined"
                sx={{ borderColor: "#D92D20", color: "#D92D20" }}
                onClick={() => setCancelOpen(true)}
              >
                Cancel Invoice
              </ThemeButton>
            )}
            {["Draft", "Issued"].includes(inv.status) === false && (
              <Typography fontSize={13} color="text.secondary">
                No further status actions for a {inv.status.toLowerCase()} invoice.
              </Typography>
            )}
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography fontWeight={600} mb={1}>
            Status History
          </Typography>
          <Stack spacing={1}>
            {history.length === 0 && (
              <Typography fontSize={13} color="text.secondary">
                No history yet.
              </Typography>
            )}
            {history.map((h) => (
              <Box key={h._id} sx={{ borderLeft: "2px solid #D0D5DD", pl: 1.5, py: 0.5 }}>
                <Typography fontSize={13} fontWeight={600}>
                  {h.fromStatus ? `${h.fromStatus} → ${h.toStatus}` : h.toStatus}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {h.createdAt ? new Date(h.createdAt).toLocaleString() : ""}
                  {h.changedBy ? ` · ${h.changedBy.firstName} ${h.changedBy.lastName}` : ""}
                </Typography>
                {h.remarks && (
                  <Typography fontSize={12} color="text.secondary">
                    {h.remarks}
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        </Paper>
      </Stack>

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Typography fontWeight={600} mb={1}>
          Receipts
        </Typography>
        <Stack spacing={1} mb={2}>
          {receipts.length === 0 && (
            <Typography fontSize={13} color="text.secondary">
              No receipts posted against this invoice yet.
            </Typography>
          )}
          {receipts.map((r) => (
            <Box key={r._id} sx={{ border: "1px solid #EAECF0", borderRadius: 2, p: 1.5, display: "flex", justifyContent: "space-between" }}>
              <Box>
                <Typography fontWeight={600} fontSize={14}>
                  {r.receiptNumber}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {r.mode}
                  {r.referenceNumber ? ` · ${r.referenceNumber}` : ""}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "right" }}>
                <Typography fontWeight={600} fontSize={14}>
                  {r.amount}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  {r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : "-"}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>

        {issuedCreditNotes.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography fontWeight={600} mb={1}>
              Credit Notes Applied
            </Typography>
            <Stack spacing={1} mb={2}>
              {issuedCreditNotes.map((c) => (
                <Box
                  key={c._id}
                  sx={{ border: "1px solid #EAECF0", borderRadius: 2, p: 1.5, display: "flex", justifyContent: "space-between" }}
                >
                  <Box>
                    <Typography fontWeight={600} fontSize={14}>
                      {c.creditNoteNumber}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {c.reason || "No reason given"}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography fontWeight={600} fontSize={14}>
                      {c.amount}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "-"}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </>
        )}

        {RECEIVABLE_STATUSES.includes(inv.status) && receiptPermissions?.create && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography fontWeight={600} mb={1}>
              Post Receipt
            </Typography>
            <Typography fontSize={12} color="text.secondary" mb={2}>
              Outstanding balance: {outstanding}
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
              <Box flex={1}>
                <ThemeInput
                  labelName="Amount"
                  type="number"
                  fullWidth
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </Box>
              <Box flex={1}>
                <ThemeInput
                  labelName="Payment Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                />
              </Box>
              <Box flex={1}>
                <ThemeSelect
                  label="Mode"
                  options={MODES.map((m) => ({ label: m, value: m }))}
                  value={mode}
                  onChange={(_, v) => setMode(v)}
                  required
                />
              </Box>
              <Box flex={1}>
                <ThemeInput
                  labelName="Reference No."
                  fullWidth
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </Box>
            </Stack>
            <ThemeInput
              labelName="Notes"
              fullWidth
              multiline
              minRows={2}
              value={receiptNotes}
              onChange={(e) => setReceiptNotes(e.target.value)}
              sx={{ mb: 2 }}
            />
            <ThemeButton onClick={handlePostReceipt} disabled={receiptLoading} sx={{ background: "#12B76A" }}>
              {receiptLoading ? <CircularProgress size={20} color="inherit" /> : "Post Receipt"}
            </ThemeButton>
          </>
        )}
      </Paper>

      <CustomDialog open={cancelOpen} onClose={() => setCancelOpen(false)} title="Cancel Invoice" maxWidth="xs">
        <ThemeInput
          labelName="Reason"
          fullWidth
          required
          multiline
          minRows={3}
          value={cancelRemarks}
          onChange={(e) => setCancelRemarks(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
        />
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <ThemeButton variant="outlined" onClick={() => setCancelOpen(false)}>
            Close
          </ThemeButton>
          <ThemeButton
            sx={{ background: "#D92D20" }}
            onClick={async () => {
              if (!cancelRemarks.trim()) {
                toast.error("A reason is required");
                return;
              }
              await dispatch(cancelInvoiceThunk({ id: inv._id, remarks: cancelRemarks }));
              setCancelOpen(false);
              setCancelRemarks("");
            }}
          >
            Confirm Cancel
          </ThemeButton>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default InvoiceDetailPage;
