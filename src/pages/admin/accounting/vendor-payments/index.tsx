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

const VendorPaymentPage = () => {
  const dispatch = useAppDispatch();
  const { vendorPayments, loading, totalCount } = useAppSelector((state) => state.vendorPayments);
  const { user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  const canCreate = user?.role?.permissions?.vendorpayment?.create;

  useEffect(() => {
    dispatch(getAllVendorPaymentsThunk(undefined));
  }, [dispatch]);

  const refreshData = () => dispatch(getAllVendorPaymentsThunk(undefined));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
