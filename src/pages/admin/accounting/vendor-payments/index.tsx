import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddVendorPaymentDialog from "@/component/vendorpaymentdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllVendorPaymentsThunk } from "@/store/slices/vendorPaymentSlice";

const columns = [
  { id: "paymentNumber", label: "Payment No." },
  { id: "vendor", label: "Vendor" },
  { id: "purchaseOrder", label: "Purchase Order" },
  { id: "company", label: "Company" },
  { id: "amount", label: "Amount" },
  { id: "mode", label: "Mode" },
  { id: "paymentDate", label: "Date" },
];

interface VendorPaymentRow {
  id: string;
  _id: string;
  paymentNumber: string;
  amount: number;
  mode: string;
  paymentDate?: string;
  vendor?: { name: string };
  purchaseOrder?: { poNumber: string };
  companyName?: { companyName: string };
}

const csvColumns = [
  { id: "paymentNumber", label: "Payment No.", value: (row: VendorPaymentRow) => row.paymentNumber },
  { id: "vendor", label: "Vendor", value: (row: VendorPaymentRow) => row.vendor?.name || "-" },
  { id: "purchaseOrder", label: "Purchase Order", value: (row: VendorPaymentRow) => row.purchaseOrder?.poNumber || "-" },
  { id: "company", label: "Company", value: (row: VendorPaymentRow) => row.companyName?.companyName || "-" },
  { id: "amount", label: "Amount", value: (row: VendorPaymentRow) => row.amount },
  { id: "mode", label: "Mode", value: (row: VendorPaymentRow) => row.mode },
  { id: "paymentDate", label: "Date", value: (row: VendorPaymentRow) => (row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : "-") },
];

const VendorPaymentPage = () => {
  const dispatch = useAppDispatch();
  const { vendorPayments, loading, totalCount } = useAppSelector((state) => state.vendorPayments);
  const { user } = useAppSelector((state) => state.auth);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: this page never read
  // the company toggle -- Vendor Payments always mixed both companies.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);
  const [open, setOpen] = useState(false);

  const canCreate = user?.role?.permissions?.vendorpayment?.create;

  useEffect(() => {
    dispatch(getAllVendorPaymentsThunk({ companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  const refreshData = () => dispatch(getAllVendorPaymentsThunk({ companyName: activeCompanyId || undefined }));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Vendor Payments
        </Typography>
        {canCreate && (
          <ThemeButton
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Vendor Payment
          </ThemeButton>
        )}
      </Box>

      {loading && vendorPayments.length === 0 ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={vendorPayments.map((vp: any) => ({ ...vp, id: vp._id }))}
          totalCount={totalCount}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="vendor-payments"
          renderRow={(row: VendorPaymentRow) => (
            <>
              <TableCell>{row.paymentNumber}</TableCell>
              <TableCell>{row.vendor?.name || "-"}</TableCell>
              <TableCell>
                {row.purchaseOrder?.poNumber ? (
                  <ThemeChip
                    label={row.purchaseOrder.poNumber}
                    sx={{ background: "#D1E9FF", color: "#175CD3", fontWeight: 600 }}
                  />
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>{row.companyName?.companyName || "-"}</TableCell>
              <TableCell>{row.amount}</TableCell>
              <TableCell>{row.mode}</TableCell>
              <TableCell>{row.paymentDate ? new Date(row.paymentDate).toLocaleDateString() : "-"}</TableCell>
            </>
          )}
        />
      )}

      <AddVendorPaymentDialog open={open} onClose={() => setOpen(false)} refreshData={refreshData} />
    </Box>
  );
};

export default VendorPaymentPage;
