// Module 9: a live-computed vendor ledger -- purchase orders and purchases
// as debits, vendor payments and issued debit notes as credits. "Post
// Payment" here is the multi-PO allocation flow; the single-PO "New Vendor
// Payment" dialog on the Vendor Payments list page is unaffected.
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
import { getAllVendorsThunk } from "@/store/slices/vendorSlice";
import { getAllPurchaseOrdersThunk } from "@/store/slices/purchaseOrderSlice";
import { getVendorLedgerThunk, clearVendorLedger } from "@/store/slices/financeSlice";
import { createVendorPaymentAllocationThunk, clearVendorPaymentError, clearVendorPaymentSuccessMessage } from "@/store/slices/vendorPaymentSlice";
import { toast } from "react-toastify";

const MODES = ["Cash", "Bank Transfer", "UPI", "Cheque", "Other"];
const OPEN_STATUSES = ["Sent", "Partially Received", "Received"];

const ledgerColumns = [
  { id: "date", label: "Date" },
  { id: "type", label: "Type" },
  { id: "reference", label: "Reference" },
  { id: "debit", label: "Debit" },
  { id: "credit", label: "Credit" },
  { id: "runningBalance", label: "Balance" },
];

const poAmount = (po: any) => (po.items || []).reduce((sum: number, it: any) => sum + Number(it.quantityOrdered) * Number(it.rate), 0);

const VendorLedgerPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { vendors } = useAppSelector((state) => state.vendors);
  const { purchaseOrders } = useAppSelector((state) => state.purchaseOrders);
  const { vendorLedger, loading } = useAppSelector((state) => state.finance);
  const { loading: allocating, successMessage, error } = useAppSelector((state) => state.vendorPayments);
  const { user } = useAppSelector((state) => state.auth);
  const vendorPaymentPermissions = user?.role?.permissions?.vendorpayment;

  const [vendor, setVendor] = useState<any>(null);
  const [allocateOpen, setAllocateOpen] = useState(false);
  const [selectedPoIds, setSelectedPoIds] = useState<Record<string, string>>({});
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [mode, setMode] = useState<any>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    dispatch(getAllVendorsThunk());
  }, [dispatch]);

  const vendorOptions = useMemo(
    () => (vendors || []).map((v: any) => ({ label: v.name, value: v._id, companyId: v.companyName?._id })),
    [vendors]
  );

  const selectedVendor: any = (vendors || []).find((v: any) => v._id === vendor?.value);
  const companyId = typeof selectedVendor?.companyName === "object" ? selectedVendor.companyName?._id : selectedVendor?.companyName || "";

  const loadLedger = (vendorId: string) => {
    dispatch(getVendorLedgerThunk({ vendorId }));
    dispatch(getAllPurchaseOrdersThunk({ vendorId }));
  };

  useEffect(() => {
    if (vendor?.value) loadLedger(vendor.value);
    else dispatch(clearVendorLedger());
  }, [vendor?.value, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearVendorPaymentSuccessMessage());
      setAllocateOpen(false);
      setSelectedPoIds({});
      setAmount("");
      setMode(null);
      setReferenceNumber("");
      setNotes("");
      if (vendor?.value) loadLedger(vendor.value);
    }
    if (error) {
      toast.error(error);
      dispatch(clearVendorPaymentError());
    }
  }, [successMessage, error, dispatch]);

  const openPOs = (purchaseOrders || []).filter((po: any) => OPEN_STATUSES.includes(po.status));

  const allocatedTotal = Object.values(selectedPoIds).reduce((sum, v) => sum + (Number(v) || 0), 0);

  const handleTogglePO = (poId: string, amountDue: number) => {
    setSelectedPoIds((prev) => {
      const next = { ...prev };
      if (next[poId] !== undefined) delete next[poId];
      else next[poId] = String(amountDue);
      return next;
    });
  };

  const handleSubmitAllocation = async () => {
    const allocations = Object.entries(selectedPoIds)
      .filter(([, v]) => Number(v) > 0)
      .map(([purchaseOrderId, v]) => ({ purchaseOrderId, amount: Number(v) }));
    if (!amount || Number(amount) <= 0 || !mode) {
      toast.error("Enter a positive amount and select a payment mode");
      return;
    }
    if (allocations.length === 0) {
      toast.error("Select at least one purchase order and allocate an amount to it");
      return;
    }
    if (allocatedTotal > Number(amount)) {
      toast.error(`Allocated total (${allocatedTotal}) exceeds the payment amount (${amount})`);
      return;
    }
    if (!vendor?.value || !companyId) {
      toast.error("Select a vendor whose company can be determined");
      return;
    }
    await dispatch(
      createVendorPaymentAllocationThunk({
        vendorId: vendor.value,
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
          Vendor Ledger
        </Typography>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/accounting/vendor-ageing")}>
          View Ageing
        </ThemeButton>
      </Box>

      <Box maxWidth={360} mb={3}>
        <ThemeSelect label="Vendor" options={vendorOptions} value={vendor} onChange={(_, v) => setVendor(v)} />
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {!loading && vendor && vendorLedger && (
        <>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={3}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
              <Typography fontSize={13} color="text.secondary">
                Outstanding Balance
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {vendorLedger.outstandingBalance}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
              <Typography fontSize={13} color="text.secondary">
                Credit Limit
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {vendorLedger.creditLimit != null ? vendorLedger.creditLimit : "No limit set"}
              </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1, display: "flex", alignItems: "center" }}>
              {vendorLedger.overCreditLimit ? (
                <ThemeChip label="Over Credit Limit" sx={{ background: "#FEE4E2", color: "#B42318", fontWeight: 600 }} />
              ) : (
                <ThemeChip label="Within Credit Limit" sx={{ background: "#D1FADF", color: "#027A48", fontWeight: 600 }} />
              )}
            </Paper>
          </Stack>

          {vendorPaymentPermissions?.create && (
            <Box mb={2}>
              <ThemeButton onClick={() => setAllocateOpen(true)} sx={{ background: "#12B76A" }}>
                Post Payment (multi-PO)
              </ThemeButton>
            </Box>
          )}

          <BasicTable
            tableHeader={ledgerColumns}
            rowData={vendorLedger.rows.map((r, i) => ({ ...r, id: `${r.refId}-${i}` }))}
            showDatePicker={false}
            showSearch={false}
            showFillter={false}
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

      {!vendor && (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography fontSize={14} color="text.secondary">
            Select a vendor above to see their ledger.
          </Typography>
        </Paper>
      )}

      <CustomDialog open={allocateOpen} onClose={() => setAllocateOpen(false)} title="Post Payment Across Purchase Orders" maxWidth="md" fullWidth>
        <Typography fontSize={13} color="text.secondary" mb={2}>
          Check the purchase orders this payment should apply to and set the amount for each.
        </Typography>
        {openPOs.length === 0 ? (
          <Typography fontSize={14} color="text.secondary" mb={2}>
            No open purchase orders for this vendor.
          </Typography>
        ) : (
          <Stack spacing={1} mb={2}>
            {openPOs.map((po: any) => {
              const total = poAmount(po);
              const checked = selectedPoIds[po._id] !== undefined;
              return (
                <Box key={po._id} sx={{ border: "1px solid #EAECF0", borderRadius: 2, p: 1, display: "flex", alignItems: "center", gap: 2 }}>
                  <Checkbox checked={checked} onChange={() => handleTogglePO(po._id, total)} />
                  <Box flex={1}>
                    <Typography fontWeight={600} fontSize={14}>
                      {po.poNumber}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      PO total: {total} · Status: {po.status}
                    </Typography>
                  </Box>
                  {checked && (
                    <Box width={140}>
                      <ThemeInput
                        labelName="Allocate"
                        type="number"
                        fullWidth
                        value={selectedPoIds[po._id]}
                        onChange={(e) => setSelectedPoIds((prev) => ({ ...prev, [po._id]: e.target.value }))}
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
            <ThemeInput labelName="Payment Amount" type="number" fullWidth value={amount} onChange={(e) => setAmount(e.target.value)} required />
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
            {allocating ? <CircularProgress size={20} color="inherit" /> : "Post Payment"}
          </ThemeButton>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default VendorLedgerPage;
