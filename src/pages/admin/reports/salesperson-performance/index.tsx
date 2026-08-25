// Module 14: per-staff rollup keyed off orders.created_by -- there's no
// dedicated salesperson field anywhere in the schema, so the staff member
// who logged the order stands in for it.
import React, { useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, TableCell } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getSalespersonPerformanceThunk } from "@/store/slices/reportsSlice";
import type { SalespersonPerformanceRow } from "@/services/reports.service";

const columns = [
  { id: "staff", label: "Staff" },
  { id: "orderCount", label: "Orders" },
  { id: "totalQty", label: "Total Qty" },
  { id: "revenue", label: "Revenue" },
  { id: "distinctCustomers", label: "Distinct Customers" },
];

const csvColumns = [
  { id: "staff", label: "Staff", value: (row: any) => `${row.staff?.firstName || ""} ${row.staff?.lastName || ""}`.trim() },
  { id: "orderCount", label: "Orders", value: (row: any) => row.orderCount },
  { id: "totalQty", label: "Total Qty", value: (row: any) => row.totalQty },
  { id: "revenue", label: "Revenue", value: (row: any) => row.revenue },
  { id: "distinctCustomers", label: "Distinct Customers", value: (row: any) => row.distinctCustomers },
];

const SalespersonPerformancePage = () => {
  const dispatch = useAppDispatch();
  const { salespersonPerformance, loading } = useAppSelector((state) => state.reports);

  useEffect(() => {
    dispatch(getSalespersonPerformanceThunk());
  }, [dispatch]);

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Salesperson Performance
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : salespersonPerformance.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography fontSize={14} color="text.secondary">
            No orders recorded yet.
          </Typography>
        </Paper>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={salespersonPerformance.map((r, i) => ({ ...r, id: r.staff?._id || String(i) }))}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="salesperson-performance"
          renderRow={(row: any) => (
            <>
              <TableCell>{`${row.staff?.firstName || ""} ${row.staff?.lastName || ""}`.trim() || "-"}</TableCell>
              <TableCell>{row.orderCount}</TableCell>
              <TableCell>{row.totalQty}</TableCell>
              <TableCell>{row.revenue}</TableCell>
              <TableCell>{row.distinctCustomers}</TableCell>
            </>
          )}
        />
      )}
    </Box>
  );
};

export default SalespersonPerformancePage;
