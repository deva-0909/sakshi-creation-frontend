import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useRouter } from "next/router";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddInvoiceDialog from "@/component/invoicedialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllInvoicesThunk } from "@/store/slices/invoiceSlice";

const columns = [
  { id: "invoiceNumber", label: "Invoice No." },
  { id: "company", label: "Company" },
  { id: "party", label: "Party" },
  { id: "gstType", label: "GST" },
  { id: "grandTotal", label: "Total" },
  { id: "amountPaid", label: "Paid" },
  { id: "status", label: "Status" },
  { id: "invoiceDate", label: "Date" },
  { id: "options", label: "" },
];

const statusColor = (status: string): { bg: string; color: string } => {
  switch (status) {
    case "Draft":
      return { bg: "#F2F4F7", color: "#344054" };
    case "Issued":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Partially Paid":
      return { bg: "#FEF0C7", color: "#B54708" };
    case "Paid":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

interface InvoiceRow {
  id: string;
  _id: string;
  invoiceNumber: string;
  gstType: string;
  grandTotal: number;
  amountPaid: number;
  status: string;
  invoiceDate?: string;
  companyName?: { companyName: string };
  party?: { partyName: string };
}

const csvColumns = [
  { id: "invoiceNumber", label: "Invoice No.", value: (row: InvoiceRow) => row.invoiceNumber },
  { id: "company", label: "Company", value: (row: InvoiceRow) => row.companyName?.companyName || "-" },
  { id: "party", label: "Party", value: (row: InvoiceRow) => row.party?.partyName || "-" },
  { id: "gstType", label: "GST", value: (row: InvoiceRow) => (row.gstType === "CGST_SGST" ? "CGST+SGST" : row.gstType) },
  { id: "grandTotal", label: "Total", value: (row: InvoiceRow) => row.grandTotal },
  { id: "amountPaid", label: "Paid", value: (row: InvoiceRow) => row.amountPaid },
  { id: "status", label: "Status", value: (row: InvoiceRow) => row.status },
  { id: "invoiceDate", label: "Date", value: (row: InvoiceRow) => (row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : "-") },
];

const InvoicePage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { invoices, loading, totalCount } = useAppSelector((state) => state.invoices);
  const { user } = useAppSelector((state) => state.auth);
  // QP order-process audit (2026-08-25): this list already showed a Company
  // column but never actually scoped to the active company -- getAllInvoices
  // had no companyName filter at all (unlike orders/job cards/purchases/
  // complaints/dye-punches, which all already followed this pattern).
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);
  const [open, setOpen] = useState(false);

  const canCreate = user?.role?.permissions?.invoice?.create;

  useEffect(() => {
    dispatch(getAllInvoicesThunk({ companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  const refreshData = () => dispatch(getAllInvoicesThunk({ companyName: activeCompanyId || undefined }));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Invoices
        </Typography>
        {canCreate && (
          <ThemeButton
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Invoice
          </ThemeButton>
        )}
      </Box>

      {loading && invoices.length === 0 ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={invoices.map((i: any) => ({ ...i, id: i._id }))}
          totalCount={totalCount}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="invoices"
          renderRow={(row: InvoiceRow) => {
            const { bg, color } = statusColor(row.status);
            return (
              <>
                <TableCell>{row.invoiceNumber}</TableCell>
                <TableCell>{row.companyName?.companyName || "-"}</TableCell>
                <TableCell>{row.party?.partyName || "-"}</TableCell>
                <TableCell>{row.gstType === "CGST_SGST" ? "CGST+SGST" : row.gstType}</TableCell>
                <TableCell>{row.grandTotal}</TableCell>
                <TableCell>{row.amountPaid}</TableCell>
                <TableCell>
                  <ThemeChip label={row.status} sx={{ background: bg, color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>{row.invoiceDate ? new Date(row.invoiceDate).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  <ThemeButton
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/admin/accounting/invoices/view/${row._id}`)}
                  >
                    View
                  </ThemeButton>
                </TableCell>
              </>
            );
          }}
        />
      )}

      <AddInvoiceDialog open={open} onClose={() => setOpen(false)} refreshData={refreshData} />
    </Box>
  );
};

export default InvoicePage;
