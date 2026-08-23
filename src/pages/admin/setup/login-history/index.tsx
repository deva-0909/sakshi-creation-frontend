import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, Pagination } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeChip from "@/component/common_component/themechip";
import { useAppDispatch, useAppSelector } from "@/store";
import { getLoginHistoryThunk } from "@/store/slices/loginHistorySlice";

const columns = [
  { id: "id", label: "#" },
  { id: "staff", label: "Staff" },
  { id: "attemptedEmail", label: "Email Used" },
  { id: "loginAt", label: "When" },
  { id: "success", label: "Result" },
  { id: "failureReason", label: "Failure Reason" },
  { id: "ipAddress", label: "IP Address" },
];

const csvColumns = [
  {
    id: "staff",
    label: "Staff",
    value: (row: any) =>
      row.staffId ? `${row.staffId.firstName || ""} ${row.staffId.lastName || ""}`.trim() || row.staffId.email : "-",
  },
  { id: "attemptedEmail", label: "Email Used", value: (row: any) => row.attemptedEmail },
  { id: "loginAt", label: "When", value: (row: any) => (row.loginAt ? new Date(row.loginAt).toLocaleString() : "-") },
  { id: "success", label: "Result", value: (row: any) => (row.success ? "Success" : "Failed") },
  { id: "failureReason", label: "Failure Reason", value: (row: any) => row.failureReason || "-" },
  { id: "ipAddress", label: "IP Address", value: (row: any) => row.ipAddress || "-" },
];

// Module 10: read-only audit trail of login attempts (success and failure),
// recorded fire-and-forget from staff.controller.js's loginStaff on every outcome.
const LoginHistoryPage = () => {
  const dispatch = useAppDispatch();
  const { entries, pagination, loading } = useAppSelector((state) => state.loginHistory);
  const { user } = useAppSelector((state) => state.auth);
  const permissions = user?.role?.permissions?.staff;

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(getLoginHistoryThunk({ page, limit: 25 }));
  }, [dispatch, page]);

  if (!permissions?.view_global) {
    return (
      <Box p={3}>
        <Typography>You do not have permission to view login history.</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Login History
        </Typography>
        <Typography fontSize={14} color="text.secondary">
          Every login attempt, successful or failed, across all staff accounts.
        </Typography>
      </Box>

      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={entries.map((e: any) => ({ ...e }))}
        csvColumns={csvColumns}
        exportFilename="login-history"
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{(page - 1) * 25 + idx + 1}</TableCell>
            <TableCell>{row.staffId ? `${row.staffId.firstName || ""} ${row.staffId.lastName || ""}`.trim() || row.staffId.email : "-"}</TableCell>
            <TableCell>{row.attemptedEmail}</TableCell>
            <TableCell>{row.loginAt ? new Date(row.loginAt).toLocaleString() : "-"}</TableCell>
            <TableCell>
              <ThemeChip
                label={row.success ? "Success" : "Failed"}
                sx={{
                  background: row.success ? "#D1FADF" : "#FEE4E2",
                  color: row.success ? "#027A48" : "#B42318",
                  fontWeight: 600,
                }}
              />
            </TableCell>
            <TableCell>{row.failureReason || "-"}</TableCell>
            <TableCell>{row.ipAddress || "-"}</TableCell>
          </>
        )}
      />

      {pagination && pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Pagination
            count={pagination.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            disabled={loading}
            color="secondary"
          />
        </Box>
      )}
    </Box>
  );
};

export default LoginHistoryPage;
