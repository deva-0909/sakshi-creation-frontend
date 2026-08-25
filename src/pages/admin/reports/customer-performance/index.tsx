// Module 14: per-party rollup of order volume, revenue, and on-time
// delivery rate.
import React, { useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, TableCell } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getCustomerPerformanceThunk } from "@/store/slices/reportsSlice";
import type { CustomerPerformanceRow } from "@/services/reports.service";

const columns = [
  { id: "party", label: "Party" },
  { id: "orderCount", label: "Orders" },
  { id: "totalQty", label: "Total Qty" },
  { id: "revenue", label: "Revenue" },
  { id: "onTimeDeliveryRatePct", label: "On-Time Delivery" },
];

const csvColumns = [
  { id: "party", label: "Party", value: (row: any) => row.party?.partyName || "-" },
  { id: "orderCount", label: "Orders", value: (row: any) => row.orderCount },
  { id: "totalQty", label: "Total Qty", value: (row: any) => row.totalQty },
  { id: "revenue", label: "Revenue", value: (row: any) => row.revenue },
  { id: "onTimeDeliveryRatePct", label: "On-Time Delivery %", value: (row: any) => row.onTimeDeliveryRatePct ?? "" },
];

const CustomerPerformancePage = () => {
  const dispatch = useAppDispatch();
  const { customerPerformance, loading } = useAppSelector((state) => state.reports);

  useEffect(() => {
    dispatch(getCustomerPerformanceThunk());
  }, [dispatch]);

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Customer Performance
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : customerPerformance.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography fontSize={14} color="text.secondary">
            No orders recorded yet.
          </Typography>
        </Paper>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={customerPerformance.map((r, i) => ({ ...r, id: r.party?._id || String(i) }))}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="customer-performance"
          renderRow={(row: any) => (
            <>
              <TableCell>{row.party?.partyName || "-"}</TableCell>
              <TableCell>{row.orderCount}</TableCell>
              <TableCell>{row.totalQty}</TableCell>
              <TableCell>{row.revenue}</TableCell>
              <TableCell>{row.onTimeDeliveryRatePct !== null ? `${row.onTimeDeliveryRatePct}%` : "-"}</TableCell>
            </>
          )}
        />
      )}
    </Box>
  );
};

export default CustomerPerformancePage;
