import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, Divider, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllVendorsThunk } from "@/store/slices/vendorSlice";
import {
  getPurchaseRequisitionByIdThunk,
  getPurchaseRequisitionHistoryThunk,
  submitPrForApprovalThunk,
  approvePurchaseRequisitionThunk,
  rejectPurchaseRequisitionThunk,
  cancelPurchaseRequisitionThunk,
  convertPrToRfqThunk,
  convertPrToPoThunk,
  clearSinglePurchaseRequisition,
  clearPurchaseRequisitionError,
  clearPurchaseRequisitionSuccessMessage,
} from "@/store/slices/purchaseRequisitionSlice";
import { toast } from "react-toastify";

const statusColor = (status: string): { bg: string; color: string } => {
  switch (status) {
    case "Draft":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Pending Approval":
      return { bg: "#FEF0C7", color: "#B54708" };
    case "Approved":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Rejected":
      return { bg: "#FEE4E2", color: "#B42318" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    case "Converted":
      return { bg: "#D1E9FF", color: "#175CD3" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

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

const PurchaseRequisitionDetailPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const {
    singlePurchaseRequisition: pr,
    history,
    loading,
    error,
    successMessage,
  } = useAppSelector((state) => state.purchaseRequisitions);
  const { vendors } = useAppSelector((state) => state.vendors);
  const { user } = useAppSelector((state) => state.auth);

  const permissions = user?.role?.permissions?.purchaserequisition;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const [convertPoOpen, setConvertPoOpen] = useState(false);
  const [poVendor, setPoVendor] = useState<{ label: string; value: string | number } | null>(null);
  const [poExpectedDate, setPoExpectedDate] = useState("");
  const [poNotes, setPoNotes] = useState("");
  const [poRates, setPoRates] = useState<Record<string, string>>({});

  const load = () => {
    if (typeof id === "string") {
      dispatch(getPurchaseRequisitionByIdThunk(id));
      dispatch(getPurchaseRequisitionHistoryThunk(id));
    }
  };

  useEffect(() => {
    load();
    dispatch(getAllVendorsThunk(undefined));
    return () => {
      dispatch(clearSinglePurchaseRequisition());
    };
  }, [id, dispatch]);

  // Mobile/toggle/seed audit (2026-08-26), Phase D: the PR's own company
  // isn't known until it loads, so the unconditional fetch above stays
  // unscoped (fine for an initial paint); once the PR resolves, re-fetch
  // scoped to its own company so the Convert-to-PO vendor picker doesn't
  // offer the other company's vendors.
  useEffect(() => {
    if (pr?.companyName?._id) {
      dispatch(getAllVendorsThunk({ companyName: pr.companyName._id }));
    }
  }, [pr?.companyName?._id, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearPurchaseRequisitionSuccessMessage());
      if (successMessage.includes("converted to purchase order")) {
        router.push("/admin/procurement/purchase-orders");
      } else if (successMessage.includes("converted to RFQ")) {
        router.push("/admin/procurement/rfq");
      }
    }
    if (error) {
      toast.error(error);
      dispatch(clearPurchaseRequisitionError());
    }
  }, [successMessage, error, dispatch, router]);

  if (loading && !pr) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!pr) return null;

  const { bg, color } = statusColor(pr.status);
  const vendorOptions = vendors.map((v: any) => ({ label: v.name, value: v._id }));

  const doAction = async (action: any) => {
    await dispatch(action);
  };

  const openConvertPo = () => {
    setPoVendor(null);
    setPoExpectedDate("");
    setPoNotes("");
    const rates: Record<string, string> = {};
    (pr.items || []).forEach((it) => {
      rates[it._id] = "";
    });
    setPoRates(rates);
    setConvertPoOpen(true);
  };

  const submitConvertPo = async () => {
    if (!poVendor) {
      toast.error("Select a vendor");
      return;
    }
    const items = (pr.items || []).map((it) => ({ requisitionItemId: it._id, rate: Number(poRates[it._id] || 0) }));
    const missingRate = items.find((it) => !(it.rate > 0));
    if (missingRate) {
      toast.error("Enter a positive rate for every material");
      return;
    }
    await dispatch(
      convertPrToPoThunk({
        id: pr._id,
        data: {
          vendorId: String(poVendor.value),
          expectedDate: poExpectedDate || undefined,
          notes: poNotes || undefined,
          items,
        },
      })
    );
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight={600}>
            {pr.requisitionNumber}
          </Typography>
          <ThemeChip label={pr.status} sx={{ background: bg, color, fontWeight: 600 }} />
        </Box>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/procurement/purchase-requisitions")}>
          Back to list
        </ThemeButton>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 2 }}>
          <Typography fontWeight={600} mb={1}>
            Details
          </Typography>
          <DetailRow label="Company" value={pr.companyName?.companyName} />
          <DetailRow label="Notes" value={pr.notes} />
          <DetailRow
            label="Requested By"
            value={pr.requestedBy ? `${pr.requestedBy.firstName} ${pr.requestedBy.lastName}` : "-"}
          />
          <DetailRow label="Created At" value={pr.createdAt ? new Date(pr.createdAt).toLocaleString() : "-"} />
          {pr.approvedBy && (
            <DetailRow
              label="Approved By"
              value={`${pr.approvedBy.firstName} ${pr.approvedBy.lastName} ${
                pr.approvedAt ? `[${new Date(pr.approvedAt).toLocaleString()}]` : ""
              }`}
            />
          )}

          <Divider sx={{ my: 2 }} />
          <Typography fontWeight={600} mb={1}>
            Materials Required
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Qty Required</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(pr.items || []).map((it) => (
                <TableRow key={it._id}>
                  <TableCell>{it.material?.materialName || "-"}</TableCell>
                  <TableCell>{it.quantityRequired}</TableCell>
                  <TableCell>{it.notes || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
          <Typography fontWeight={600} mb={2}>
            Actions
          </Typography>
          <Stack spacing={1.5}>
            {pr.status === "Draft" && permissions?.edit && (
              <ThemeButton onClick={() => doAction(submitPrForApprovalThunk(pr._id))} sx={{ background: "#175CD3" }}>
                Submit for Approval
              </ThemeButton>
            )}
            {pr.status === "Pending Approval" && permissions?.approve && (
              <>
                <ThemeButton onClick={() => doAction(approvePurchaseRequisitionThunk(pr._id))} sx={{ background: "#12B76A" }}>
                  Approve
                </ThemeButton>
                <ThemeButton variant="outlined" sx={{ borderColor: "#D92D20", color: "#D92D20" }} onClick={() => setRejectOpen(true)}>
                  Reject
                </ThemeButton>
              </>
            )}
            {pr.status === "Approved" && permissions?.edit && (
              <>
                <ThemeButton onClick={() => doAction(convertPrToRfqThunk(pr._id))} sx={{ background: "#175CD3" }}>
                  Convert to RFQ
                </ThemeButton>
                <ThemeButton onClick={openConvertPo} sx={{ background: "#12B76A" }}>
                  Convert to Purchase Order
                </ThemeButton>
              </>
            )}
            {["Draft", "Pending Approval", "Approved"].includes(pr.status) && permissions?.edit && (
              <ThemeButton
                variant="outlined"
                sx={{ borderColor: "#D92D20", color: "#D92D20" }}
                onClick={() => {
                  const remarks = window.prompt("Reason for cancelling this requisition:") || "";
                  if (remarks.trim()) dispatch(cancelPurchaseRequisitionThunk({ id: pr._id, remarks }));
                }}
              >
                Cancel Requisition
              </ThemeButton>
            )}
            {["Draft", "Pending Approval", "Approved"].includes(pr.status) === false && (
              <Typography fontSize={13} color="text.secondary">
                No further status actions for a {pr.status.toLowerCase()} requisition.
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

      <CustomDialog open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Purchase Requisition" maxWidth="xs">
        <ThemeInput
          labelName="Reason"
          fullWidth
          required
          multiline
          minRows={3}
          value={rejectRemarks}
          onChange={(e) => setRejectRemarks(e.target.value)}
          sx={{ mb: 2, mt: 1 }}
        />
        <Box display="flex" justifyContent="flex-end" gap={2}>
          <ThemeButton variant="outlined" onClick={() => setRejectOpen(false)}>
            Cancel
          </ThemeButton>
          <ThemeButton
            sx={{ background: "#D92D20" }}
            onClick={async () => {
              if (!rejectRemarks.trim()) {
                toast.error("A reason is required");
                return;
              }
              await dispatch(rejectPurchaseRequisitionThunk({ id: pr._id, remarks: rejectRemarks }));
              setRejectOpen(false);
              setRejectRemarks("");
            }}
          >
            Confirm Reject
          </ThemeButton>
        </Box>
      </CustomDialog>

      <CustomDialog open={convertPoOpen} onClose={() => setConvertPoOpen(false)} title="Convert to Purchase Order" maxWidth="sm">
        <Box mt={1}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
            <Box flex={1}>
              <ThemeSelect label="Vendor" options={vendorOptions} value={poVendor} onChange={(_, v) => setPoVendor(v)} required />
            </Box>
            <Box flex={1}>
              <ThemeInput
                labelName="Expected Date (optional)"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={poExpectedDate}
                onChange={(e) => setPoExpectedDate(e.target.value)}
              />
            </Box>
          </Stack>

          <Table size="small" sx={{ mb: 2 }}>
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Qty Required</TableCell>
                <TableCell>Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(pr.items || []).map((it) => (
                <TableRow key={it._id}>
                  <TableCell>{it.material?.materialName || "-"}</TableCell>
                  <TableCell>{it.quantityRequired}</TableCell>
                  <TableCell sx={{ width: 140 }}>
                    <ThemeInput
                      type="number"
                      fullWidth
                      value={poRates[it._id] || ""}
                      onChange={(e) => setPoRates((prev) => ({ ...prev, [it._id]: e.target.value }))}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <ThemeInput
            labelName="Notes"
            fullWidth
            multiline
            minRows={2}
            value={poNotes}
            onChange={(e) => setPoNotes(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box display="flex" justifyContent="flex-end" gap={2}>
            <ThemeButton variant="outlined" onClick={() => setConvertPoOpen(false)}>
              Cancel
            </ThemeButton>
            <ThemeButton onClick={submitConvertPo} sx={{ background: "#12B76A" }}>
              Create Purchase Order
            </ThemeButton>
          </Box>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default PurchaseRequisitionDetailPage;
