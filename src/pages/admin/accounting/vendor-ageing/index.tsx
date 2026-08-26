// Module 9: payables ageing -- open purchase orders and purchases bucketed
// by days since transaction/creation date (no due-date concept exists yet
// for POs/purchases -- that's Module 11 scope -- so this is a scoped
// simplification, documented on the backend too).
import React, { useEffect } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, TableCell, Chip } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getVendorAgeingThunk } from "@/store/slices/financeSlice";

const BUCKET_COLORS: Record<string, { bg: string; color: string }> = {
  Current: { bg: "#D1FADF", color: "#027A48" },
  "1-30": { bg: "#FEF0C7", color: "#B54708" },
  "31-60": { bg: "#FEDF89", color: "#93370D" },
  "61-90": { bg: "#FECDCA", color: "#B42318" },
  "90+": { bg: "#FEE4E2", color: "#912018" },
};

const columns = [
  { id: "reference", label: "Reference" },
  { id: "type", label: "Type" },
  { id: "vendor", label: "Vendor" },
  { id: "amount", label: "Amount" },
  { id: "daysOld", label: "Days Old" },
  { id: "bucket", label: "Bucket" },
];

const csvColumns = [
  { id: "reference", label: "Reference", value: (row: any) => row.reference },
  { id: "type", label: "Type", value: (row: any) => row.type },
  { id: "vendor", label: "Vendor", value: (row: any) => row.vendor?.name || "-" },
  { id: "amount", label: "Amount", value: (row: any) => row.amount },
  { id: "daysOld", label: "Days Old", value: (row: any) => row.daysOld },
  { id: "bucket", label: "Bucket", value: (row: any) => row.bucket },
];

const VendorAgeingPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { vendorAgeing, loading } = useAppSelector((state) => state.finance);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: the thunk already
  // supported companyName -- this page just never passed it.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  useEffect(() => {
    dispatch(getVendorAgeingThunk({ companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  const buckets = vendorAgeing?.buckets;
  const rows = vendorAgeing?.rows || [];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Vendor Ageing
        </Typography>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/accounting/vendor-ledger")}>
          View Ledger
        </ThemeButton>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {buckets && (
            <Stack direction="row" spacing={2} mb={3} flexWrap="wrap" useFlexGap>
              {Object.entries(buckets).map(([bucket, amount]) => (
                <Paper key={bucket} variant="outlined" sx={{ p: 2, borderRadius: 2, minWidth: 150 }}>
                  <Chip size="small" label={bucket} sx={{ background: BUCKET_COLORS[bucket]?.bg, color: BUCKET_COLORS[bucket]?.color, fontWeight: 600, mb: 1 }} />
                  <Typography variant="h6" fontWeight={700}>
                    {amount}
                  </Typography>
                </Paper>
              ))}
            </Stack>
          )}

          {rows.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
              <Typography fontSize={14} color="text.secondary">
                No open purchase orders or purchases.
              </Typography>
            </Paper>
          ) : (
            <BasicTable
              tableHeader={columns}
              rowData={rows.map((r: any, i: number) => ({ ...r, id: `${r.type}-${r.reference}-${i}` }))}
              showDatePicker={false}
              showSearch={false}
              showFillter={false}
              csvColumns={csvColumns}
              exportFilename="vendor-ageing"
              renderRow={(row: any) => (
                <>
                  <TableCell>{row.reference}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.vendor?.name || "-"}</TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell>{row.daysOld}</TableCell>
                  <TableCell>
                    <Chip size="small" label={row.bucket} sx={{ background: BUCKET_COLORS[row.bucket]?.bg, color: BUCKET_COLORS[row.bucket]?.color, fontWeight: 600 }} />
                  </TableCell>
                </>
              )}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default VendorAgeingPage;
