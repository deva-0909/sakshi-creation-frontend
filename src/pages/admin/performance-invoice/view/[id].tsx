"use client";

import React, { useEffect } from "react";
import { Box, Typography, Paper, Stack, CircularProgress, Divider } from "@mui/material";
import { useRouter } from "next/router";
import BackButton from "@/component/common_component/BackButton";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { getPerformanceInvoiceByIdThunk } from "@/store/slices/performanceInvoiceSlice";
import InvoicePDFGenerator from "@/component/InvoicePDFGenerator";

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Box display="flex" justifyContent="space-between" py={0.75} borderBottom="1px solid #F2F4F7">
    <Typography fontSize={14} color="#667085">
      {label}
    </Typography>
    <Typography fontSize={14} fontWeight={600} color="#101828">
      {value === "" || value === null || value === undefined ? "-" : value}
    </Typography>
  </Box>
);

const PerformanceInvoiceDetailPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { id } = router.query;
  const { singlePerformanceInvoice: inv, loading } = useAppSelector((state) => state.performanceInvoices);

  useEffect(() => {
    if (typeof id === "string") {
      dispatch(getPerformanceInvoiceByIdThunk(id));
    }
  }, [id, dispatch]);

  if (loading && !inv) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!inv) return null;

  // The detail GET response returns companyName/partyName as bare IDs, with
  // the populated objects available separately as companyNameObj/partyObj
  // (see backend controllers/performanceInvoice.controller.js
  // getPerformanceInvoiceById) -- so those are what we display from.
  const invAny = inv as any;
  const companyDisplayName = invAny.companyNameObj?.name || invAny.companyNameObj?.companyName || "N/A";
  const partyDisplayName = invAny.partyObj?.partyName || "N/A";
  const assignedToName = invAny.assignedTo
    ? `${invAny.assignedTo.firstName || ""} ${invAny.assignedTo.lastName || ""}`.trim() || "-"
    : "-";

  const fullAddress = [
    inv.partyAddress?.unitNo || "",
    inv.partyAddress?.streetAddress || "",
    inv.partyAddress?.marketName || "",
    inv.partyAddress?.landMark || "",
    inv.partyAddress?.area || "",
    inv.partyAddress?.pincode || "",
  ]
    .filter((part) => part.trim() !== "")
    .join(", ");

  return (
    <Box p={3}>
      <BackButton />
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Performance Invoice - {inv.orderNumber || "N/A"}
        </Typography>
        <ThemeButton variant="outlined" onClick={() => router.push("/admin/performance-invoice")}>
          Back to list
        </ThemeButton>
      </Box>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} mb={2}>
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 2 }}>
          <Typography fontWeight={600} mb={1}>
            Details
          </Typography>
          <DetailRow label="Order Number" value={inv.orderNumber} />
          <DetailRow label="Company" value={companyDisplayName} />
          <DetailRow label="Party" value={partyDisplayName} />
          <DetailRow label="Party Address" value={fullAddress} />
          <DetailRow label="GST No." value={inv.GSTNo} />
          <DetailRow label="Service/Performance" value={inv.servicePerformance} />
          <DetailRow label="Assigned To" value={assignedToName} />
          <DetailRow label="Payment Terms" value={inv.paymentTerms} />

          <Divider sx={{ my: 2 }} />
          <Typography fontWeight={600} mb={1}>
            Item
          </Typography>
          <DetailRow label="Color" value={inv.color} />
          <DetailRow label="Size" value={inv.size} />
          <DetailRow label="Printing Type" value={invAny.pType} />
          <DetailRow label="Quantity" value={inv.quantity} />
          <DetailRow label="Unit Price" value={inv.unitPrice} />

          <Divider sx={{ my: 2 }} />
          <Box sx={{ ml: "auto", maxWidth: 260 }}>
            <DetailRow label="Total" value={inv.total} />
            <DetailRow label="GST Applied" value={inv.applyGST ? "Yes" : "No"} />
            <DetailRow label="Final Amount" value={inv.finalAmount} />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, flex: 1 }}>
          <Typography fontWeight={600} mb={2}>
            Actions
          </Typography>
          <InvoicePDFGenerator
            formData={{
              orderNumber: inv.orderNumber || "",
              companyName: companyDisplayName,
              remarks: "",
              ownerMobileNo: inv.ownerMobileNo || "",
              partyName: partyDisplayName,
              addressName: fullAddress,
              GSTNo: inv.GSTNo || "",
              servicePerformance: inv.servicePerformance || "",
              quantity: inv.quantity || 0,
              unitPrice: inv.unitPrice || 0,
              total: inv.total || 0,
              finalAmount: inv.finalAmount || 0,
              color: inv.color,
              size: inv.size,
              pType: invAny.pType,
              paymentTerms: inv.paymentTerms,
              signature: inv.signature,
              applyGST: inv.applyGST,
            }}
            isSaved={true}
            onClose={() => {}}
          />
        </Paper>
      </Stack>
    </Box>
  );
};

export default PerformanceInvoiceDetailPage;
