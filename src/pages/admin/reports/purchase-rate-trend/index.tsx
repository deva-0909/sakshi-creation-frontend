// Module 14: purchase rate history normalized across the 3 independent
// sources (legacy purchases.rate_per_sheet, purchase_order_items.rate,
// grn_items.rate) into one (materialId, rate, date, source) timeline.
import React, { useEffect } from "react";
import { Box, Typography, Paper, CircularProgress, TableCell, Chip } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getPurchaseRateTrendThunk } from "@/store/slices/reportsSlice";
import type { PurchaseRateTrendRow } from "@/services/reports.service";

const SOURCE_LABEL: Record<string, string> = {
  purchase: "Purchase",
  purchase_order: "Purchase Order",
  grn: "GRN",
};

const columns = [
  { id: "date", label: "Date" },
  { id: "material", label: "Material" },
  { id: "rate", label: "Rate" },
  { id: "source", label: "Source" },
];

const csvColumns = [
  { id: "date", label: "Date", value: (row: any) => row.date },
  { id: "material", label: "Material", value: (row: any) => row.material?.materialName || "-" },
  { id: "rate", label: "Rate", value: (row: any) => row.rate },
  { id: "source", label: "Source", value: (row: any) => SOURCE_LABEL[row.source] || row.source },
];

const PurchaseRateTrendPage = () => {
  const dispatch = useAppDispatch();
  const { purchaseRateTrend, loading } = useAppSelector((state) => state.reports);

  useEffect(() => {
    dispatch(getPurchaseRateTrendThunk(undefined));
  }, [dispatch]);

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Purchase Rate Trend
      </Typography>
      <Typography fontSize={13} color="text.secondary" mb={2}>
        Every recorded material rate across purchases, purchase order line items, and GRNs, oldest first.
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : purchaseRateTrend.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
          <Typography fontSize={14} color="text.secondary">
            No purchase rate history recorded yet.
          </Typography>
        </Paper>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={purchaseRateTrend.map((r, i) => ({ ...r, id: `${r.materialId}-${r.date}-${i}` }))}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="purchase-rate-trend"
          renderRow={(row: any) => (
            <>
              <TableCell>{row.date}</TableCell>
              <TableCell>{row.material?.materialName || "-"}</TableCell>
              <TableCell>{row.rate}</TableCell>
              <TableCell>
                <Chip size="small" label={SOURCE_LABEL[row.source] || row.source} sx={{ background: "#EFF8FF", color: "#175CD3", fontWeight: 600 }} />
              </TableCell>
            </>
          )}
        />
      )}
    </Box>
  );
};

export default PurchaseRateTrendPage;
