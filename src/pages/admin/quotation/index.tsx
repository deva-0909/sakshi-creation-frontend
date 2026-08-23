import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useRouter } from "next/router";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddQuotationDialog from "@/component/quotationdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllQuotationsThunk } from "@/store/slices/quotationSlice";

const columns = [
  { id: "quotationNumber", label: "Quotation No." },
  { id: "company", label: "Company" },
  { id: "party", label: "Party" },
  { id: "item", label: "Item" },
  { id: "qty", label: "Qty" },
  { id: "totalAmount", label: "Amount" },
  { id: "status", label: "Status" },
  { id: "createdAt", label: "Created" },
  { id: "options", label: "" },
];

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
    case "Expired":
      return { bg: "#F2F4F7", color: "#667085" };
    case "Converted":
      return { bg: "#E9D7FE", color: "#6941C6" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

interface QuotationRow {
  id: string;
  _id: string;
  quotationNumber: string;
  qty: number;
  totalAmount?: number;
  status: string;
  createdAt?: string;
  companyName?: { companyName: string };
  party?: { partyName: string };
  productItem?: { itemName: string };
}

const QuotationPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { quotations, loading, totalCount } = useAppSelector((state) => state.quotations);
  const { user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  const canCreate = user?.role?.permissions?.quotation?.create;

  useEffect(() => {
    dispatch(getAllQuotationsThunk(undefined));
  }, [dispatch]);

  const refreshData = () => dispatch(getAllQuotationsThunk(undefined));

  const csvColumns = [
    { id: "quotationNumber", label: "Quotation No.", value: (row: QuotationRow) => row.quotationNumber },
    { id: "company", label: "Company", value: (row: QuotationRow) => row.companyName?.companyName || "-" },
    { id: "party", label: "Party", value: (row: QuotationRow) => row.party?.partyName || "-" },
    { id: "item", label: "Item", value: (row: QuotationRow) => row.productItem?.itemName || "-" },
    { id: "qty", label: "Qty", value: (row: QuotationRow) => row.qty },
    { id: "totalAmount", label: "Amount", value: (row: QuotationRow) => (row.totalAmount != null ? row.totalAmount : "-") },
    { id: "status", label: "Status", value: (row: QuotationRow) => row.status },
    {
      id: "createdAt",
      label: "Created",
      value: (row: QuotationRow) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"),
    },
  ];

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Quotations
        </Typography>
        {canCreate && (
          <ThemeButton
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Quotation
          </ThemeButton>
        )}
      </Box>

      {loading && quotations.length === 0 ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={quotations.map((q: any) => ({ ...q, id: q._id }))}
          totalCount={totalCount}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="quotations"
          renderRow={(row: QuotationRow) => {
            const { bg, color } = statusColor(row.status);
            return (
              <>
                <TableCell>{row.quotationNumber}</TableCell>
                <TableCell>{row.companyName?.companyName || "-"}</TableCell>
                <TableCell>{row.party?.partyName || "-"}</TableCell>
                <TableCell>{row.productItem?.itemName || "-"}</TableCell>
                <TableCell>{row.qty}</TableCell>
                <TableCell>{row.totalAmount != null ? row.totalAmount : "-"}</TableCell>
                <TableCell>
                  <ThemeChip label={row.status} sx={{ background: bg, color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  <ThemeButton
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/admin/quotation/view/${row._id}`)}
                  >
                    View
                  </ThemeButton>
                </TableCell>
              </>
            );
          }}
        />
      )}

      <AddQuotationDialog open={open} onClose={() => setOpen(false)} refreshData={refreshData} />
    </Box>
  );
};

export default QuotationPage;
