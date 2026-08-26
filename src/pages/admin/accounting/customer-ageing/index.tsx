// Module 9: receivables ageing -- every open invoice bucketed by days
// overdue (against dueDate, falling back to invoiceDate when none is set).
import React, { useEffect } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, TableCell, Chip } from "@mui/material";
import { useRouter } from "next/router";
import ThemeButton from "@/component/common_component/themebutton";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getCustomerAgeingThunk } from "@/store/slices/financeSlice";

const BUCKET_COLORS: Record<string, { bg: string; color: string }> = {
  Current: { bg: "#D1FADF", color: "#027A48" },
  "1-30": { bg: "#FEF0C7", color: "#B54708" },
  "31-60": { bg: "#FEDF89", color: "#93370D" },
  "61-90": { bg: "#FECDCA", color: "#B42318" },
  "90+": { bg: "#FEE4E2", color: "#912018" },
};

const columns = [
  { id: "invoiceNumber", label: "Invoice" },
  { id: "party", label: "Party" },
  { id: "outstanding", label: "Outstanding" },
  { id: "daysOverdue", label: "Days Overdue" },
  { id: "bucket", label: "Bucket" },
];

const csvColumns = [
  { id: "invoiceNumber", label: "Invoice", value: (row: any) => row.invoiceNumber },
  { id: "party", label: "Party", value: (row: any) => row.party?.partyName || "-" },
  { id: "outstanding", label: "Outstanding", value: (row: any) => row.outstanding },
  { id: "daysOverdue", label: "Days Overdue", value: (row: any) => row.daysOverdue },
  { id: "bucket", label: "Bucket", value: (row: any) => row.bucket },
];

const CustomerAgeingPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { customerAgeing, loading } = useAppSelector((state) => state.finance);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: the thunk already
  // supported companyName -- this page just never passed it.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  useEffect(() => {
    dispatch(getCustomerAgeingThunk({ companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  const buckets = customerAgeing?.buckets;
  const rows = customerAgeing?.rows || [];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Customer Ageing
        </Typography>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/accounting/customer-ledger")}>
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
                No open invoices.
              </Typography>
            </Paper>
          ) : (
            <BasicTable
              tableHeader={columns}
              rowData={rows.map((r: any) => ({ ...r, id: r._id }))}
              showDatePicker={false}
              showSearch={false}
              showFillter={false}
              csvColumns={csvColumns}
              exportFilename="customer-ageing"
              renderRow={(row: any) => (
                <>
                  <TableCell>{row.invoiceNumber}</TableCell>
                  <TableCell>{row.party?.partyName || "-"}</TableCell>
                  <TableCell>{row.outstanding}</TableCell>
                  <TableCell>{row.daysOverdue}</TableCell>
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

export default CustomerAgeingPage;
