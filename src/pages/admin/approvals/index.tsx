import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, CircularProgress, TextField } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import CustomDialog from "@/component/customdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getMyPendingApprovalsThunk } from "@/store/slices/approvalSlice";
import { approveQuotationThunk, rejectQuotationThunk } from "@/store/slices/quotationSlice";
import { approvePurchaseOrderThunk, rejectPurchaseOrderThunk } from "@/store/slices/purchaseOrderSlice";
import { PendingApproval } from "@/services/approval.service";
import { useRouter } from "next/router";

const columns = [
  { id: "type", label: "Type" },
  { id: "number", label: "Number" },
  { id: "companyName", label: "Company" },
  { id: "who", label: "Party / Vendor" },
  { id: "createdBy", label: "Submitted By" },
  { id: "createdAt", label: "Submitted" },
  { id: "actions", label: "Actions" },
];

const TYPE_LABEL: Record<string, string> = { quotation: "Quotation", purchaseOrder: "Purchase Order" };

// Cross-module inbox of everything sitting at Pending Approval that the
// logged-in staff member can act on -- backed by GET /approvals/pending,
// which already scopes results to the caller's own quotation.approve /
// purchaseorder.approve permissions, so nothing extra needs to be checked
// here to decide what shows up. Approve/Reject reuse the exact same
// thunks the per-module detail pages already use (Modules 1 & 3), so
// acting from this inbox is functionally identical to acting from the
// record's own page.
const ApprovalsPage = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { pending, loading } = useAppSelector((state) => state.approvals);
  const [rejectTarget, setRejectTarget] = useState<PendingApproval | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");

  const load = () => dispatch(getMyPendingApprovalsThunk());

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const handleApprove = async (row: PendingApproval) => {
    if (row.type === "quotation") await dispatch(approveQuotationThunk(row._id));
    else await dispatch(approvePurchaseOrderThunk(row._id));
    load();
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget || !rejectRemarks.trim()) return;
    if (rejectTarget.type === "quotation") await dispatch(rejectQuotationThunk({ id: rejectTarget._id, remarks: rejectRemarks }));
    else await dispatch(rejectPurchaseOrderThunk({ id: rejectTarget._id, remarks: rejectRemarks }));
    setRejectTarget(null);
    setRejectRemarks("");
    load();
  };

  const csvColumns = [
    { id: "type", label: "Type", value: (row: any) => TYPE_LABEL[row.type] || row.type },
    { id: "number", label: "Number", value: (row: any) => row.number },
    { id: "companyName", label: "Company", value: (row: any) => row.companyName?.companyName || "-" },
    { id: "who", label: "Party / Vendor", value: (row: any) => row.party?.partyName || row.vendor?.name || "-" },
    { id: "createdBy", label: "Submitted By", value: (row: any) => row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : "-" },
    { id: "createdAt", label: "Submitted", value: (row: any) => new Date(row.createdAt).toLocaleDateString() },
  ];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Pending My Approval
        </Typography>
      </Box>

      {loading && pending.length === 0 ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : pending.length === 0 ? (
        <Box p={6} textAlign="center">
          <Typography color="text.secondary">Nothing is waiting on your approval right now.</Typography>
        </Box>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={pending.map((p: any) => ({ ...p, id: p._id }))}
          totalCount={pending.length}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="pending-approvals"
          renderRow={(row: PendingApproval) => (
            <>
              <TableCell>
                <ThemeChip
                  label={TYPE_LABEL[row.type] || row.type}
                  sx={{ background: "#F4EBFF", color: "#7B06C2", fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>
                <Typography
                  component="a"
                  onClick={() => router.push(row.link)}
                  sx={{ cursor: "pointer", color: "#7B06C2", fontWeight: 600, "&:hover": { textDecoration: "underline" } }}
                >
                  {row.number}
                </Typography>
              </TableCell>
              <TableCell>{row.companyName?.companyName || "-"}</TableCell>
              <TableCell>{row.party?.partyName || row.vendor?.name || "-"}</TableCell>
              <TableCell>{row.createdBy ? `${row.createdBy.firstName} ${row.createdBy.lastName}` : "-"}</TableCell>
              <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
              <TableCell>
                <Box display="flex" gap={1}>
                  <ThemeButton size="small" onClick={() => handleApprove(row)} sx={{ background: "#12B76A", "&:hover": { background: "#0D9155" } }}>
                    Approve
                  </ThemeButton>
                  <ThemeButton
                    size="small"
                    variant="outlined"
                    onClick={() => setRejectTarget(row)}
                    sx={{ borderColor: "#D92D20", color: "#D92D20" }}
                  >
                    Reject
                  </ThemeButton>
                </Box>
              </TableCell>
            </>
          )}
        />
      )}

      <CustomDialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} title={`Reject ${rejectTarget ? TYPE_LABEL[rejectTarget.type] : ""}`} maxWidth="xs">
        <TextField
          label="Remarks"
          fullWidth
          multiline
          minRows={3}
          value={rejectRemarks}
          onChange={(e) => setRejectRemarks(e.target.value)}
          sx={{ mt: 1 }}
        />
        <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
          <ThemeButton variant="outlined" onClick={() => setRejectTarget(null)}>
            Cancel
          </ThemeButton>
          <ThemeButton
            disabled={!rejectRemarks.trim()}
            onClick={handleConfirmReject}
            sx={{ background: "#D92D20", "&:hover": { background: "#B42318" } }}
          >
            Confirm Reject
          </ThemeButton>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default ApprovalsPage;
