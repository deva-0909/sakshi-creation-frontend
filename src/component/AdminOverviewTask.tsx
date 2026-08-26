import React from "react";
import { Box, TableCell } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import { useRouter } from "next/router";

// Mobile/toggle/seed audit (2026-08-26), Phase G: admin/history/index.tsx's
// renderRoleSpecificComponent switch had no "admin" case at all -- despite
// getRoleSpecificTasks() right above it already special-casing "admin" to
// return every order -- so any Admin/Sales/Procurement/Accounts/Store user
// landing on this page saw a bare "No component available for your role"
// message. DesignerTask/PrinterTask/BindrTask/BookletBinderTask each render
// one stage's status column, which doesn't fit an admin overview spanning
// every stage -- this renders the overall order status instead, matching
// what All Orders already shows.

interface Column {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
}

const tableHeader: Column[] = [
  { id: "orderNo", label: "Order No." },
  { id: "party", label: "Party" },
  { id: "item", label: "Item Name" },
  { id: "createdAt", label: "Date" },
  { id: "status", label: "Status", align: "center" as const },
];

interface AdminOverviewTaskProps {
  tasks: Array<{
    _id: string;
    orderNumber: string;
    party?: { partyName: string };
    productItem?: { itemName: string };
    createdAt: string;
    status: string;
  }>;
}

const AdminOverviewTask: React.FC<AdminOverviewTaskProps> = ({ tasks }) => {
  const router = useRouter();

  const rowData = tasks.map((order) => ({
    id: order._id,
    orderNo: order.orderNumber,
    party: order.party?.partyName || "N/A",
    item: order.productItem?.itemName || "N/A",
    createdAt: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A",
    status: order.status || "N/A",
  }));

  const csvColumns = [
    { id: "orderNo", label: "Order No.", value: (row: (typeof rowData)[number]) => row.orderNo },
    { id: "party", label: "Party", value: (row: (typeof rowData)[number]) => row.party },
    { id: "item", label: "Item Name", value: (row: (typeof rowData)[number]) => row.item },
    { id: "createdAt", label: "Date", value: (row: (typeof rowData)[number]) => row.createdAt },
    { id: "status", label: "Status", value: (row: (typeof rowData)[number]) => row.status },
  ];

  return (
    <BasicTable
      tableHeader={tableHeader}
      rowData={rowData}
      showDatePicker={false}
      showSearch
      showFillter
      csvColumns={csvColumns}
      exportFilename="admin-order-overview"
      renderRow={(row) => (
        <>
          <TableCell
            onClick={() => router.push(`/admin/all-orders/view?id=${row.id}`)}
            sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" } }}
          >
            {row.orderNo}
          </TableCell>
          <TableCell>{row.party}</TableCell>
          <TableCell>{row.item}</TableCell>
          <TableCell>{row.createdAt}</TableCell>
          <TableCell align="center">
            <Box
              sx={{
                display: "inline-block",
                px: 1.5,
                py: 0.5,
                borderRadius: "8px",
                fontSize: 12,
                fontWeight: 500,
                bgcolor: "#F2F4F7",
                color: "#344054",
              }}
            >
              {row.status}
            </Box>
          </TableCell>
        </>
      )}
    />
  );
};

export default AdminOverviewTask;
