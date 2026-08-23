import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useRouter } from "next/router";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddRfqDialog from "@/component/rfqdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllRfqsThunk } from "@/store/slices/rfqSlice";

const columns = [
  { id: "rfqNumber", label: "RFQ No." },
  { id: "company", label: "Company" },
  { id: "items", label: "Items" },
  { id: "vendors", label: "Vendors Invited" },
  { id: "status", label: "Status" },
  { id: "createdAt", label: "Created" },
  { id: "options", label: "" },
];

const statusColor = (status: string): { bg: string; color: string } => {
  switch (status) {
    case "Draft":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Sent":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Closed":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

interface RfqRow {
  id: string;
  _id: string;
  rfqNumber: string;
  status: string;
  createdAt?: string;
  companyName?: { companyName: string };
  items?: any[];
  quotes?: any[];
}

const RfqPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { rfqs, loading, totalCount } = useAppSelector((state) => state.rfqs);
  const { user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  const canCreate = user?.role?.permissions?.rfq?.create;

  useEffect(() => {
    dispatch(getAllRfqsThunk(undefined));
  }, [dispatch]);

  const refreshData = () => dispatch(getAllRfqsThunk(undefined));

  const csvColumns = [
    { id: "rfqNumber", label: "RFQ No.", value: (row: RfqRow) => row.rfqNumber },
    { id: "company", label: "Company", value: (row: RfqRow) => row.companyName?.companyName || "-" },
    { id: "items", label: "Items", value: (row: RfqRow) => row.items?.length ?? "-" },
    { id: "vendors", label: "Vendors Invited", value: (row: RfqRow) => row.quotes?.length ?? "-" },
    { id: "status", label: "Status", value: (row: RfqRow) => row.status },
    {
      id: "createdAt",
      label: "Created",
      value: (row: RfqRow) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"),
    },
  ];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Requests for Quotation
        </Typography>
        {canCreate && (
          <ThemeButton
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New RFQ
          </ThemeButton>
        )}
      </Box>

      {loading && rfqs.length === 0 ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={rfqs.map((r: any) => ({ ...r, id: r._id }))}
          totalCount={totalCount}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="rfqs"
          renderRow={(row: RfqRow) => {
            const { bg, color } = statusColor(row.status);
            return (
              <>
                <TableCell>{row.rfqNumber}</TableCell>
                <TableCell>{row.companyName?.companyName || "-"}</TableCell>
                <TableCell>{row.items?.length ?? "-"}</TableCell>
                <TableCell>{row.quotes?.length ?? "-"}</TableCell>
                <TableCell>
                  <ThemeChip label={row.status} sx={{ background: bg, color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  <ThemeButton
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/admin/procurement/rfq/view/${row._id}`)}
                  >
                    View
                  </ThemeButton>
                </TableCell>
              </>
            );
          }}
        />
      )}

      <AddRfqDialog open={open} onClose={() => setOpen(false)} refreshData={refreshData} />
    </Box>
  );
};

export default RfqPage;
