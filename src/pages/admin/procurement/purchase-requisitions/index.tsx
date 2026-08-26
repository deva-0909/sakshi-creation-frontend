import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useRouter } from "next/router";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddPurchaseRequisitionDialog from "@/component/purchaserequisitiondialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllPurchaseRequisitionsThunk } from "@/store/slices/purchaseRequisitionSlice";

const columns = [
  { id: "requisitionNumber", label: "Requisition No." },
  { id: "company", label: "Company" },
  { id: "items", label: "Items" },
  { id: "status", label: "Status" },
  { id: "requestedBy", label: "Requested By" },
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
    case "Rejected":
      return { bg: "#FEE4E2", color: "#B42318" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    case "Converted":
      return { bg: "#D1E9FF", color: "#175CD3" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

interface PurchaseRequisitionRow {
  id: string;
  _id: string;
  requisitionNumber: string;
  status: string;
  createdAt?: string;
  companyName?: { companyName: string };
  requestedBy?: { firstName: string; lastName: string };
  items?: any[];
}

const PurchaseRequisitionPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { purchaseRequisitions, loading, totalCount } = useAppSelector((state) => state.purchaseRequisitions);
  const { user } = useAppSelector((state) => state.auth);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: this page never read
  // the company toggle even though the backend already supported it.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);
  const [open, setOpen] = useState(false);

  const canCreate = user?.role?.permissions?.purchaserequisition?.create;

  useEffect(() => {
    dispatch(getAllPurchaseRequisitionsThunk({ companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  const refreshData = () => dispatch(getAllPurchaseRequisitionsThunk({ companyName: activeCompanyId || undefined }));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Purchase Requisitions
        </Typography>
        {canCreate && (
          <ThemeButton
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Requisition
          </ThemeButton>
        )}
      </Box>

      {loading && purchaseRequisitions.length === 0 ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={purchaseRequisitions.map((p: any) => ({ ...p, id: p._id }))}
          totalCount={totalCount}
          showDatePicker={false}
          csvColumns={[
            { id: "requisitionNumber", label: "Requisition No.", value: (row: PurchaseRequisitionRow) => row.requisitionNumber },
            { id: "company", label: "Company", value: (row: PurchaseRequisitionRow) => row.companyName?.companyName || "-" },
            { id: "items", label: "Items", value: (row: PurchaseRequisitionRow) => row.items?.length ?? "-" },
            { id: "status", label: "Status", value: (row: PurchaseRequisitionRow) => row.status },
            { id: "requestedBy", label: "Requested By", value: (row: PurchaseRequisitionRow) => (row.requestedBy ? `${row.requestedBy.firstName} ${row.requestedBy.lastName}` : "-") },
            { id: "createdAt", label: "Created", value: (row: PurchaseRequisitionRow) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-") },
          ]}
          exportFilename="purchase-requisitions"
          renderRow={(row: PurchaseRequisitionRow) => {
            const { bg, color } = statusColor(row.status);
            return (
              <>
                <TableCell>{row.requisitionNumber}</TableCell>
                <TableCell>{row.companyName?.companyName || "-"}</TableCell>
                <TableCell>{row.items?.length ?? "-"}</TableCell>
                <TableCell>
                  <ThemeChip label={row.status} sx={{ background: bg, color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>{row.requestedBy ? `${row.requestedBy.firstName} ${row.requestedBy.lastName}` : "-"}</TableCell>
                <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  <ThemeButton
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/admin/procurement/purchase-requisitions/view/${row._id}`)}
                  >
                    View
                  </ThemeButton>
                </TableCell>
              </>
            );
          }}
        />
      )}

      <AddPurchaseRequisitionDialog open={open} onClose={() => setOpen(false)} refreshData={refreshData} />
    </Box>
  );
};

export default PurchaseRequisitionPage;
