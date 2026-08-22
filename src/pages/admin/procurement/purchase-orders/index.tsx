import React, { useEffect, useState } from "react";
import { Box, Typography, TableCell, CircularProgress } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useRouter } from "next/router";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeButton from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import AddPurchaseOrderDialog from "@/component/purchaseorderdialog";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllPurchaseOrdersThunk } from "@/store/slices/purchaseOrderSlice";

const columns = [
  { id: "poNumber", label: "PO No." },
  { id: "vendor", label: "Vendor" },
  { id: "company", label: "Company" },
  { id: "items", label: "Items" },
  { id: "status", label: "Status" },
  { id: "expectedDate", label: "Expected" },
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
    case "Sent":
      return { bg: "#D1E9FF", color: "#175CD3" };
    case "Partially Received":
      return { bg: "#FEF0C7", color: "#B54708" };
    case "Received":
      return { bg: "#D1FADF", color: "#027A48" };
    case "Cancelled":
      return { bg: "#FEE4E2", color: "#B42318" };
    default:
      return { bg: "#F2F4F7", color: "#344054" };
  }
};

interface PurchaseOrderRow {
  id: string;
  _id: string;
  poNumber: string;
  status: string;
  expectedDate?: string;
  createdAt?: string;
  vendor?: { name: string };
  companyName?: { companyName: string };
  items?: any[];
}

const PurchaseOrderPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { purchaseOrders, loading, totalCount } = useAppSelector((state) => state.purchaseOrders);
  const { user } = useAppSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  const canCreate = user?.role?.permissions?.purchaseorder?.create;

  useEffect(() => {
    dispatch(getAllPurchaseOrdersThunk(undefined));
  }, [dispatch]);

  const refreshData = () => dispatch(getAllPurchaseOrdersThunk(undefined));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Purchase Orders
        </Typography>
        {canCreate && (
          <ThemeButton
            startIcon={<Add />}
            onClick={() => setOpen(true)}
            sx={{ background: "#A409F8", "&:hover": { background: "#7B06C2" } }}
          >
            New Purchase Order
          </ThemeButton>
        )}
      </Box>

      {loading && purchaseOrders.length === 0 ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress />
        </Box>
      ) : (
        <BasicTable
          tableHeader={columns}
          rowData={purchaseOrders.map((p: any) => ({ ...p, id: p._id }))}
          totalCount={totalCount}
          showDatePicker={false}
          renderRow={(row: PurchaseOrderRow) => {
            const { bg, color } = statusColor(row.status);
            return (
              <>
                <TableCell>{row.poNumber}</TableCell>
                <TableCell>{row.vendor?.name || "-"}</TableCell>
                <TableCell>{row.companyName?.companyName || "-"}</TableCell>
                <TableCell>{row.items?.length ?? "-"}</TableCell>
                <TableCell>
                  <ThemeChip label={row.status} sx={{ background: bg, color, fontWeight: 600 }} />
                </TableCell>
                <TableCell>{row.expectedDate ? new Date(row.expectedDate).toLocaleDateString() : "-"}</TableCell>
                <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  <ThemeButton
                    variant="outlined"
                    size="small"
                    onClick={() => router.push(`/admin/procurement/purchase-orders/view/${row._id}`)}
                  >
                    View
                  </ThemeButton>
                </TableCell>
              </>
            );
          }}
        />
      )}

      <AddPurchaseOrderDialog open={open} onClose={() => setOpen(false)} refreshData={refreshData} />
    </Box>
  );
};

export default PurchaseOrderPage;
