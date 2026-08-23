// Module 9: a live-computed customer ledger -- pick a party, see every
// invoice (debit) and receipt/credit note (credit) with a running balance,
// plus the outstanding balance against that party's credit limit (if one is
// set). "Post Receipt" here is the multi-invoice allocation flow -- the
// single-invoice "Post Receipt" on the invoice detail page is unaffected
// and still exists for the common one-invoice case.
import React, { useEffect, useMemo, useState } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, TableCell, Checkbox } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import CustomDialog from "@/component/customdialog";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllAccountMastersThunk } from "@/store/slices/accountMasterSlice";
import { getAllInvoicesThunk } from "@/store/slices/invoiceSlice";
import { getCustomerLedgerThunk, clearCustomerLedger } from "@/store/slices/financeSlice";
import { createReceiptAllocationThunk, clearReceiptError, clearReceiptSuccessMessage } from "@/store/slices/receiptSlice";
import { toast } from "react-toastify";

const MODES = ["Cash", "Bank Transfer", "UPI", "Cheque", "Other"];
const OPEN_STATUSES = ["Issued", "Partially Paid"];

const ledgerColumns = [
  { id: "date", label: "Date" },
  { id: "type", label: "Type" },
  { id: "reference", label: "Reference" },
  { id: "debit", label: "Debit" },
  { id: "credit", label: "Credit" },
  { id: "runningBalance", label: "Balance" },
];

const csvColumns = [
  { id: "date", label: "Date", value: (row: any) => (row.date ? new Date(row.date).toLocaleDateString() : "-") },
  { id: "type", label: "Type", value: (row: any) => row.type },
  { id: "reference", label: "Reference", value: (row: any) => row.reference },
  { id: "debit", label: "Debit", value: (row: any) => row.debit || "-" },
  { id: "credit", label: "Credit", value: (row: any) => row.credit || "-" },
  { id: "runningBalance", label: "Balance", value: (row: any) => row.runningBalance },
];

const CustomerLedgerPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { accountMasters } = useAppSelector((state) => state.accountMasters);
  const { invoices } = useAppSelector((state) => state.invoices);
  const { customerLedger, loading } = useAppSelector((state) => state.finance);
  const { loading: allocating, successMessage, error } = useAppSelector((state) => state.receipts);
  const { user } = useAppSelector((state) => state.auth);
  const receiptPermissions = user?.role?.permissions?.receipt;

  const [party, setParty] = useState<any>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<any>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    dispatch(getAllAccountMastersThunk());
  }, [dispatch]);

  const partyOptions = useMemo(
    () =>
      (accountMasters || [])
        .filter((am: any) => am.party?.statusApproval === "Approved" && am.party?._id)
        .map((am: any) => ({ label: am.party.partyName, value: am.party._id, companyId: am.party.companyName?._id || am.companyName?._id }))
        // De-dupe -- the same party can appear on more than one account-master visit row.
        .filter((opt: any, idx: number, arr: any[]) => arr.findIndex((o) => o.value === opt.value) === idx),
    [accountMasters]
  );

  const selectedAccountMaster = (accountMasters || []).find((am: any) => am.party?._id === party?.value);
  const companyId = selectedAccountMaster?.party?.companyName?._id || selectedAccountMaster?.companyName?._id || "";

  const loadLedger = (partyId: string) => {
    dispatch(getCustomerLedgerThunk({ partyId }));
    dispatch(getAllInvoicesThunk({ partyId }));
  };

  useEffect(() => {
    if (party?.value) loadLedger(party.value);
    else dispatch(clearCustomerLedger());
  }, [party?.value, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearReceiptSuccessMessage());
      setAllocateOpen(false);
      setSelectedInvoiceIds({});
      setAmount("");
      setMode(null);
      setReferenceNumber("");
      setNotes("");
      if (party?.value) loadLedger(party.value);
    }
    if (error) {
      toast.error(error);
      dispatch(clearReceiptError());
    }
  }, [successMessage, error, dispatch]);

  const openInvoices = (invoices || []).filter((inv) => OPEN_STATUSES.includes(inv.status) && inv.grandTotal - inv.amountPaid > 0);

  const allocatedTotal = Object.values(selectedInvoiceIds).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const handleToggleInvoice = (invId: string, remaining: number) => {
    setSelectedInvoiceIds((prev) => {
      const next = { ...prev };
      if (next[invId] !== undefined) delete next[invId];
      else next[invId] = String(remaining);
      return next;
    });
  };

  const handleSubmitAllocation = async () => {
    const allocations = Object.entries(selectedInvoiceIds)
      .filter(([, v]) => Number(v) > 0)
      .map(([invoiceId, v]) => ({ invoiceId, amount: Number(v) }));
    if (!amount || Number(amount) <= 0 || !mode) {
      toast.error("Enter a positive amount and select a payment mode");
      return;
    }
    if (allocations.length === 0) {
      toast.error("Select at least one invoice and allocate an amount to it");
      return;
    }
    if (allocatedTotal > Number(amount)) {
      toast.error(`Allocated total (${allocatedTotal}) exceeds the receipt amount (${amount})`);
      return;
    }
    if (!party?.value || !companyId) {
      toast.error("Select a party whose company can be determined");
      return;
    }
    await dispatch(
      createReceiptAllocationThunk({
        partyId: party.value,
        companyName: companyId,
        amount: Number(amount),
        paymentDate,
        mode: mode.value,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        allocations,
      })
    );
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Customer Ledger
        </Typography>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/accounting/customer-ageing")}>
          View Ageing
        </ThemeButton>
      </Box>

      <Box maxWidth={360} mb={3}>
        <ThemeSelect label="Party" options={partyOptions} value={party} onChange={(_, v) => setParty(v)} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && party && customerLedger && (
        <>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
              <Typography fontSize={13} color="text.secondary">
                Outstanding Balance
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {customerLedger.outstandingBalance}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
              <Typography fontSize={13} color="text.secondary">
                Credit Limit
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {customerLedger.creditLimit != null ? customerLedger.creditLimit : "No limit set"}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, display: "flex", alignItems: "center" }}>
              {customerLedger.overCreditLimit ? (
                <ThemeChip label="Over Credit Limit" sx={{ background: "#FEE4E2", color: "#B42318", fontWeight: 600 }} />
              ) : (
                <ThemeChip label="Within Credit Limit" sx={{ background: "#D1FADF", color: "#027A48", fontWeight: 600 }} />
              )}
            </Paper>
          </Stack>

          {receiptPermissions?.create && (
            <Box mb={2}>
              <ThemeButton onClick={() => setAllocateOpen(true)} sx={{ background: "#12B76A" }}>
                Post Receipt (multi-invoice)
              </ThemeButton>
            </Box>
          )}

          <BasicTable
            tableHeader={ledgerColumns}
            rowData={customerLedger.rows.map((r, i) => ({ ...r, id: `${r.refId}-${i}` }))}
            showDatePicker={false}
            showSearch={false}
            showFillter={false}
            csvColumns={csvColumns}
            exportFilename="customer-ledger"
            renderRow={(row: any) => (
              <>
                <TableCell>{row.date ? new Date(row.date).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.reference}</TableCell>
                <TableCell>{row.debit || "-"}</TableCell>
                <TableCell>{row.credit || "-"}</TableCell>
                <TableCell>{row.runningBalance}</TableCell>
              </>
            )}
          />
        </>
      )}

      {!party && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography fontSize={14} color="text.secondary">
            Select a party above to see their ledger.
          </Typography>
        </Paper>
      )}

      <CustomDialog open={allocateOpen} onClose={() => setAllocateOpen(false)} title="Post Receipt Across Invoices" maxWidth="md" fullWidth>
        <Typography fontSize={13} color="text.secondary" mb={2}>
          Check the invoices this receipt should apply to and set the amount for each. Any leftover (receipt amount minus what's
          allocated) is recorded as an unallocated on-account amount for this party.
        </Typography>
        {openInvoices.length === 0 ? (
          <Typography fontSize={14} color="text.secondary" mb={2}>
            No open invoices for this party.
          </Typography>
        ) : (
          <Stack spacing={1} mb={2}>
            {openInvoices.map((inv) => {
              const remaining = inv.grandTotal - inv.amountPaid;
              const checked = selectedInvoiceIds[inv._id] !== undefined;
              return (
                <Box key={inv._id} sx={{ border: "1px solid #EAECF0", borderRadius: 2, p: 1, display: "flex", alignItems: "center", gap: 2 }}>
                  <Checkbox checked={checked} onChange={() => handleToggleInvoice(inv._id, remaining)} />
                  <Box flex={1}>
                    <Typography fontWeight={600} fontSize={14}>
                      {inv.invoiceNumber}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Outstanding: {remaining}
                    </Typography>
                  </Box>
                  {checked && (
                    <Box width={140}>
                      <ThemeInput
                        labelName="Allocate"
                        type="number"
                        fullWidth
                        value={selectedInvoiceIds[inv._id]}
                        onChange={(e) => setSelectedInvoiceIds((prev) => ({ ...prev, [inv._id]: e.target.value }))}
                      />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}

        <Typography fontSize={13} fontWeight={600} mb={1}>
          Allocated so far: {allocatedTotal}
        </Typography>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
          <Box flex={1}>
            <ThemeInput labelName="Receipt Amount" type="number" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} required />
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
            <ThemeSelect label="Mode" options={MODES.map((m) => ({ label: m, value: m }))} value={mode} onChange={(_, v) => setMode(v)} required />
          </Box>
          <Box flex={1}>
            <ThemeInput labelName="Reference No." fullWidth value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} />
          </Box>
        </Stack>
        <ThemeInput labelName="Notes" fullWidth multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mb: 2 }} />

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <ThemeButton variant="outlined" onClick={() => setAllocateOpen(false)}>
            Close
          </ThemeButton>
          <ThemeButton onClick={handleSubmitAllocation} disabled={allocating} sx={{ background: "#12B76A" }}>
            {allocating ? <CircularProgress size={20} color="inherit" /> : "Post Receipt"}
          </ThemeButton>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default CustomerLedgerPage;
