import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, Divider } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import ThemeInput from "@/component/common_component/themeinput";
import CustomDialog from "@/component/customdialog";
import BackButton from "@/component/common_component/BackButton";
import { useAppDispatch, useAppSelector } from "@/store";
import {
  getQuotationByIdThunk,
  getQuotationHistoryThunk,
  submitQuotationForApprovalThunk,
  approveQuotationThunk,
  rejectQuotationThunk,
  sendQuotationThunk,
  respondQuotationThunk,
  convertQuotationThunk,
  clearSingleQuotation,
  clearQuotationError,
  clearQuotationSuccessMessage,
} from "@/store/slices/quotationSlice";
import { toast } from "react-toastify";
import { quotationService } from "@/services/quotation.service";

const statusColor = (status: string): { bg: string; color: string } => {
  switch (status) {
    case "Draft":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Pending Approval":
      return { bg: "#FEF0C7", color: "#B54708" };
    case "Approved":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Sent":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Accepted":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Rejected":
      return { bg: "#FEE4E2", color: "#B42318" };
    case "Converted":
      return { bg: "#E9D7FE", color: "#7F56D9" };
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

const QuotationDetailPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const { singleQuotation: q, history, loading } = useAppSelector((state) => state.quotations);
  const { user } = useAppSelector((state) => state.auth);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const permissions = user?.role?.permissions?.quotation;

  useEffect(() => {
    if (typeof id === "string") {
      dispatch(getQuotationByIdThunk(id));
      dispatch(getQuotationHistoryThunk(id));
    }
    return () => {
      dispatch(clearSingleQuotation());
    };
  }, [id, dispatch]);

  const { error, successMessage } = useAppSelector((state) => state.quotations);
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearQuotationSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearQuotationError());
    }
  }, [successMessage, error, dispatch]);

  if (loading && !q) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!q) return null;

  const doAction = async (action: () => any, successRedirect?: string) => {
    try {
      const result = await dispatch(action()).unwrap();
      if (successRedirect) router.push(successRedirect);
    } catch (err: any) {
      // error toast handled by the effect above via slice state
    }
  };

  const { bg, color } = statusColor(q.status);

  const handleDownloadPdf = async () => {
    try {
      const blob = await quotationService.getQuotationPdf(q._id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (err: any) {
      toast.error(err?.message || "Failed to download quotation PDF");
    }
  };

  return (
    <Box p={3}>
      <BackButton />
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant="h5" fontWeight={600}>
            {q.quotationNumber}
          </Typography>
          <ThemeChip label={q.status} sx={{ background: bg, color, fontWeight: 600 }} />
        </Box>
        <Stack direction="row" spacing={1.5}>
          <ThemeButton variant="outlined" onClick={handleDownloadPdf}>
            Download PDF
          </ThemeButton>
          <ThemeButton variant="outlined" onClick={() => router.push("/admin/quotation")}>
            Back to list
          </ThemeButton>
        </Stack>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 2 }}>
          <Typography fontWeight={600} mb={1}>
            Details
          </Typography>
          <DetailRow label="Company" value={q.companyName?.companyName} />
          <DetailRow label="Party" value={q.party?.partyName} />
          <DetailRow label="Item" value={q.productItem?.itemName} />
          <DetailRow label="Qty" value={q.qty} />
          <DetailRow label="Size" value={q.size} />
          <DetailRow label="Rate" value={q.rate} />
          <DetailRow label="Printing Rate" value={q.printingrate} />
          <DetailRow label="GST" value={q.isGst ? `Applicable (${q.gstPercentage ?? "-"}%)` : "Not applicable"} />
          <DetailRow label="Total Amount" value={q.totalAmount} />
          <DetailRow label="Valid Until" value={q.validUntil ? new Date(q.validUntil).toLocaleDateString() : "-"} />
          <DetailRow label="Remarks" value={q.remarks} />
          <DetailRow
            label="Created By"
            value={q.createdBy ? `${q.createdBy.firstName} ${q.createdBy.lastName}` : "-"}
          />
          <DetailRow label="Created At" value={q.createdAt ? new Date(q.createdAt).toLocaleString() : "-"} />
          {q.approvedBy && (
            <DetailRow
              label="Approved By"
              value={`${q.approvedBy.firstName} ${q.approvedBy.lastName} ${
                q.approvedAt ? `[${new Date(q.approvedAt).toLocaleString()}]` : ""
              }`}
            />
          )}
          {q.orderId && <DetailRow label="Converted Order" value={q.orderId} />}
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
          <Typography fontWeight={600} mb={2}>
            Actions
          </Typography>
          <Stack spacing={1.5}>
            {q.status === "Draft" && permissions?.edit && (
              <ThemeButton
                onClick={() => doAction(() => submitQuotationForApprovalThunk(q._id))}
                sx={{ background: "#175CD3" }}
              >
                Submit for Approval
              </ThemeButton>
            )}
            {q.status === "Pending Approval" && permissions?.approve && (
              <>
                <ThemeButton
                  onClick={() => doAction(() => approveQuotationThunk(q._id))}
                  sx={{ background: "#12B76A" }}
                >
                  Approve
                </ThemeButton>
                <ThemeButton variant="outlined" sx={{ borderColor: "#D92D20", color: "#D92D20" }} onClick={() => setRejectOpen(true)}>
                  Reject
                </ThemeButton>
              </>
            )}
            {q.status === "Approved" && permissions?.edit && (
              <ThemeButton
                onClick={() => doAction(() => sendQuotationThunk(q._id))}
                sx={{ background: "#175CD3" }}
              >
                Mark as Sent
              </ThemeButton>
            )}
            {q.status === "Sent" && permissions?.edit && (
              <>
                <ThemeButton
                  onClick={() => doAction(() => respondQuotationThunk({ id: q._id, response: "Accepted" }))}
                  sx={{ background: "#12B76A" }}
                >
                  Mark Accepted
                </ThemeButton>
                <ThemeButton variant="outlined" sx={{ borderColor: "#D92D20", color: "#D92D20" }} onClick={() => setRejectOpen(true)}>
                  Mark Rejected
                </ThemeButton>
              </>
            )}
            {q.status === "Accepted" && permissions?.create && (
              <ThemeButton
                onClick={() => doAction(() => convertQuotationThunk(q._id))}
                sx={{ background: "#7F56D9" }}
              >
                Convert to Order
              </ThemeButton>
            )}
            {["Draft", "Pending Approval", "Approved", "Sent", "Accepted"].includes(q.status) === false && (
              <Typography fontSize={13} color="text.secondary">
                No further actions available for a {q.status.toLowerCase()} quotation.
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

      <CustomDialog open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Quotation" maxWidth="xs">
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
              const action =
                q.status === "Pending Approval"
                  ? rejectQuotationThunk({ id: q._id, remarks: rejectRemarks })
                  : respondQuotationThunk({ id: q._id, response: "Rejected", remarks: rejectRemarks });
              await dispatch(action as any);
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

export default QuotationDetailPage;
