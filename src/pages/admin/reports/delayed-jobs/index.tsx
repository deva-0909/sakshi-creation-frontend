// Module 14: orders past their expected delivery date that Module 12's
// delivery challans (the authoritative proof-of-delivery source) show as
// not yet fully delivered.
import React, { useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, TableCell, Chip } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getDelayedJobsThunk } from "@/store/slices/reportsSlice";
import type { DelayedJobRow } from "@/services/reports.service";

const columns = [
  { id: "orderNumber", label: "Order No" },
  { id: "party", label: "Party" },
  { id: "expectedDeliveryDate", label: "Expected Delivery" },
  { id: "daysOverdue", label: "Days Overdue" },
  { id: "qty", label: "Order Qty" },
  { id: "quantityRemaining", label: "Qty Remaining" },
  { id: "status", label: "Status" },
];

const csvColumns = [
  { id: "orderNumber", label: "Order No", value: (row: any) => row.orderNumber },
  { id: "party", label: "Party", value: (row: any) => row.party?.partyName || "-" },
  { id: "expectedDeliveryDate", label: "Expected Delivery", value: (row: any) => row.expectedDeliveryDate },
  { id: "daysOverdue", label: "Days Overdue", value: (row: any) => row.daysOverdue },
  { id: "qty", label: "Order Qty", value: (row: any) => row.qty },
  { id: "quantityRemaining", label: "Qty Remaining", value: (row: any) => row.quantityRemaining },
  { id: "status", label: "Status", value: (row: any) => row.status },
];

const DelayedJobsPage = () => {
  const dispatch = useAppDispatch();
  const { delayedJobs, loading } = useAppSelector((state) => state.reports);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: the thunk already
  // supported companyName -- this report just never passed it, so it
  // always mixed both companies' overdue orders together.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  useEffect(() => {
    dispatch(getDelayedJobsThunk({ companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Delayed Jobs
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : delayedJobs.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography fontSize={14} color="text.secondary">
            No orders are past their expected delivery date with quantity still outstanding.
          </Typography>
        </Paper>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={delayedJobs.map((r) => ({ ...r, id: r.id }))}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="delayed-jobs"
          renderRow={(row: any) => (
            <>
              <TableCell>{row.orderNumber}</TableCell>
              <TableCell>{row.party?.partyName || "-"}</TableCell>
              <TableCell>{row.expectedDeliveryDate}</TableCell>
              <TableCell>
                <Chip size="small" label={`${row.daysOverdue}d`} sx={{ background: "#FEE4E2", color: "#B42318", fontWeight: 600 }} />
              </TableCell>
              <TableCell>{row.qty}</TableCell>
              <TableCell>{row.quantityRemaining}</TableCell>
              <TableCell>{row.status}</TableCell>
            </>
          )}
        />
      )}
    </Box>
  );
};

export default DelayedJobsPage;
