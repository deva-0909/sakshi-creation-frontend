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
import RoleStaffSelect from "@/component/reusablecomponents/RoleStaffSelect";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllRolesThunk } from "@/store/slices/roleSlice";
import {
  getPurchaseOrderByIdThunk,
  getPurchaseOrderHistoryThunk,
  submitForApprovalThunk,
  approvePurchaseOrderThunk,
  rejectPurchaseOrderThunk,
  sendPurchaseOrderThunk,
  cancelPurchaseOrderThunk,
  clearSinglePurchaseOrder,
  clearPurchaseOrderError,
  clearPurchaseOrderSuccessMessage,
} from "@/store/slices/purchaseOrderSlice";
import { getAllGrnsThunk, createGrnThunk, clearGrnError, clearGrnSuccessMessage } from "@/store/slices/grnSlice";
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
    case "Sent":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Partially Received":
      return { bg: "#FEF0C7", color: "#B54708" };
    case "Received":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

const RECEIVABLE_STATUSES = ["Sent", "Partially Received"];

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

const PurchaseOrderDetailPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const { singlePurchaseOrder: po, history, loading, error, successMessage } = useAppSelector((state) => state.purchaseOrders);
  const { grns, loading: grnLoading, error: grnError, successMessage: grnSuccessMessage } = useAppSelector((state) => state.grns);
  const { roles } = useAppSelector((state) => state.roles);
  const { user } = useAppSelector((state) => state.auth);

  const permissions = user?.role?.permissions?.purchaseorder;
  const grnPermissions = user?.role?.permissions?.grn;

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [cancelRemarks, setCancelRemarks] = useState("");

  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().slice(0, 10));
  const [grnRole, setGrnRole] = useState<{ label: string; value: string | number } | null>(null);
  const [grnStaff, setGrnStaff] = useState<any>(null);
  const [grnNotes, setGrnNotes] = useState("");
  const [grnQty, setGrnQty] = useState<Record<string, string>>({});

  const load = () => {
    if (typeof id === "string") {
      dispatch(getPurchaseOrderByIdThunk(id));
      dispatch(getPurchaseOrderHistoryThunk(id));
      dispatch(getAllGrnsThunk({ purchaseOrderId: id }));
    }
  };

  useEffect(() => {
    load();
    dispatch(getAllRolesThunk());
    return () => {
      dispatch(clearSinglePurchaseOrder());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearPurchaseOrderSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearPurchaseOrderError());
    }
  }, [successMessage, error, dispatch]);

  useEffect(() => {
    if (grnSuccessMessage) {
      toast.success(grnSuccessMessage);
      dispatch(clearGrnSuccessMessage());
      setGrnQty({});
      setGrnStaff(null);
      setGrnNotes("");
      load();
    }
    if (grnError) {
      toast.error(grnError);
      dispatch(clearGrnError());
    }
  }, [grnSuccessMessage, grnError, dispatch]);

  if (loading && !po) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!po) return null;

  const { bg, color } = statusColor(po.status);
  const roleOptions = roles.map((r: any) => ({ label: r.roleName, value: r._id }));

  const doAction = async (action: any) => {
    await dispatch(action);
  };

  const handlePostGrn = async () => {
    if (!grnRole || !grnStaff || !receivedDate) {
      toast.error("Fill received date, role, and staff member");
      return;
    }
    const items = (po.items || [])
      .map((it) => {
        const remaining = it.quantityOrdered - it.quantityReceived;
        const qty = Number(grnQty[it._id] || 0);
        return { purchaseOrderItemId: it._id, materialId: it.material?._id, quantityReceived: qty, rate: it.rate, remaining };
      })
      .filter((it) => it.quantityReceived > 0);

    if (items.length === 0) {
      toast.error("Enter a received quantity for at least one material");
      return;
    }
    const overReceived = items.find((it) => it.quantityReceived > it.remaining);
    if (overReceived) {
      toast.error("Received quantity cannot exceed the remaining ordered quantity");
      return;
    }

    await dispatch(
      createGrnThunk({
        purchaseOrderId: po._id,
        receivedDate,
        forRole: String(grnRole.value),
        forCompany: grnStaff.value,
        notes: grnNotes || undefined,
        items: items.map(({ purchaseOrderItemId, materialId, quantityReceived, rate }) => ({
          purchaseOrderItemId,
          materialId: materialId as string,
          quantityReceived,
          rate,
        })),
      })
    );
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight={600}>
            {po.poNumber}
          </Typography>
          <ThemeChip label={po.status} sx={{ background: bg, color, fontWeight: 600 }} />
        </Box>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/procurement/purchase-orders")}>
          Back to list
        </ThemeButton>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 2 }}>
          <Typography fontWeight={600} mb={1}>
            Details
          </Typography>
          <DetailRow label="Vendor" value={po.vendor?.name} />
          <DetailRow label="Company" value={po.companyName?.companyName} />
          <DetailRow label="Expected Date" value={po.expectedDate ? new Date(po.expectedDate).toLocaleDateString() : "-"} />
          <DetailRow label="Notes" value={po.notes} />
          <DetailRow
            label="Created By"
            value={po.createdBy ? `${po.createdBy.firstName} ${po.createdBy.lastName}` : "-"}
          />
          <DetailRow label="Created At" value={po.createdAt ? new Date(po.createdAt).toLocaleString() : "-"} />
          {po.approvedBy && (
            <DetailRow
              label="Approved By"
              value={`${po.approvedBy.firstName} ${po.approvedBy.lastName} ${
                po.approvedAt ? `[${new Date(po.approvedAt).toLocaleString()}]` : ""
              }`}
            />
          )}

          <Divider sx={{ my: 2 }} />
          <Typography fontWeight={600} mb={1}>
            Materials
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Ordered</TableCell>
                <TableCell>Received</TableCell>
                <TableCell>Rate</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(po.items || []).map((it) => (
                <TableRow key={it._id}>
                  <TableCell>{it.material?.materialName || "-"}</TableCell>
                  <TableCell>{it.quantityOrdered}</TableCell>
                  <TableCell>{it.quantityReceived}</TableCell>
                  <TableCell>{it.rate}</TableCell>
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
            {po.status === "Draft" && permissions?.edit && (
              <ThemeButton onClick={() => doAction(submitForApprovalThunk(po._id))} sx={{ background: "#175CD3" }}>
                Submit for Approval
              </ThemeButton>
            )}
            {po.status === "Pending Approval" && permissions?.approve && (
              <>
                <ThemeButton onClick={() => doAction(approvePurchaseOrderThunk(po._id))} sx={{ background: "#12B76A" }}>
                  Approve
                </ThemeButton>
                <ThemeButton
                  variant="outlined"
                  sx={{ borderColor: "#D92D20", color: "#D92D20" }}
                  onClick={() => setRejectOpen(true)}
                >
                  Reject
                </ThemeButton>
              </>
            )}
            {po.status === "Approved" && permissions?.edit && (
              <ThemeButton onClick={() => doAction(sendPurchaseOrderThunk(po._id))} sx={{ background: "#175CD3" }}>
                Mark as Sent
              </ThemeButton>
            )}
            {["Draft", "Approved", "Sent"].includes(po.status) && permissions?.edit && (
              <ThemeButton
                variant="outlined"
                sx={{ borderColor: "#D92D20", color: "#D92D20" }}
                onClick={() => {
                  const remarks = window.prompt("Reason for cancelling this PO:") || "";
                  if (remarks.trim()) dispatch(cancelPurchaseOrderThunk({ id: po._id, remarks }));
                }}
              >
                Cancel PO
              </ThemeButton>
            )}
            {["Draft", "Pending Approval", "Approved", "Sent"].includes(po.status) === false && (
              <Typography fontSize={13} color="text.secondary">
                No further status actions for a {po.status.toLowerCase()} purchase order.
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

      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 2 }}>
        <Typography fontWeight={600} mb={1}>
          Goods Received (GRNs)
        </Typography>
        <Stack spacing={1} mb={2}>
          {grns.length === 0 && (
            <Typography fontSize={13} color="text.secondary">
              No GRNs posted against this PO yet.
            </Typography>
          )}
          {grns.map((g) => (
            <Box key={g._id} sx={{ border: "1px solid #EAECF0", borderRadius: 2, p: 1.5 }}>
              <Box display="flex" justifyContent="space-between">
                <Typography fontWeight={600} fontSize={14}>
                  {g.grnNumber}
                </Typography>
                <Typography fontSize={13} color="text.secondary">
                  {g.receivedDate ? new Date(g.receivedDate).toLocaleDateString() : "-"}
                </Typography>
              </Box>
              <Table size="small" sx={{ mt: 1 }}>
                <TableBody>
                  {(g.items || []).map((it) => (
                    <TableRow key={it._id}>
                      <TableCell>{it.material?.materialName || "-"}</TableCell>
                      <TableCell>{it.quantityReceived}</TableCell>
                      <TableCell>@ {it.rate}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ))}
        </Stack>

        {RECEIVABLE_STATUSES.includes(po.status) && grnPermissions?.create && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Typography fontWeight={600} mb={1}>
              Post GRN
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
              <Box flex={1}>
                <ThemeInput
                  labelName="Received Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  required
                />
              </Box>
              <Box flex={1}>
                <ThemeSelect
                  label="Role"
                  options={roleOptions}
                  value={grnRole}
                  onChange={(_, v) => {
                    setGrnRole(v);
                    setGrnStaff(null);
                  }}
                  required
                />
              </Box>
              <Box flex={1}>
                <RoleStaffSelect
                  label="Staff Member"
                  name="grnStaff"
                  value={grnStaff}
                  onChange={(_, v) => setGrnStaff(v)}
                  roleFilter={grnRole?.label || ""}
                  disabled={!grnRole}
                  required
                />
              </Box>
            </Stack>

            <Table size="small" sx={{ mb: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell>Remaining</TableCell>
                  <TableCell>Rate</TableCell>
                  <TableCell>Received Now</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(po.items || [])
                  .filter((it) => it.quantityOrdered - it.quantityReceived > 0)
                  .map((it) => (
                    <TableRow key={it._id}>
                      <TableCell>{it.material?.materialName || "-"}</TableCell>
                      <TableCell>{it.quantityOrdered - it.quantityReceived}</TableCell>
                      <TableCell>{it.rate}</TableCell>
                      <TableCell sx={{ width: 160 }}>
                        <ThemeInput
                          type="number"
                          fullWidth
                          value={grnQty[it._id] || ""}
                          onChange={(e) => setGrnQty((prev) => ({ ...prev, [it._id]: e.target.value }))}
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
              value={grnNotes}
              onChange={(e) => setGrnNotes(e.target.value)}
              sx={{ mb: 2 }}
            />

            <ThemeButton onClick={handlePostGrn} disabled={grnLoading} sx={{ background: "#12B76A" }}>
              {grnLoading ? <CircularProgress size={20} color="inherit" /> : "Post GRN"}
            </ThemeButton>
          </>
        )}
      </Paper>

      <CustomDialog open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Purchase Order" maxWidth="xs">
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
              await dispatch(rejectPurchaseOrderThunk({ id: po._id, remarks: rejectRemarks }));
              setRejectOpen(false);
              setRejectRemarks("");
            }}
          >
            Confirm Reject
          </ThemeButton>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default PurchaseOrderDetailPage;
