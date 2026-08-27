import React, { useEffect } from "react";
import { Box, TableCell } from "@mui/material";
import BasicTable from "@/component/common_component/Table/themetable";
import { useAppDispatch, useAppSelector } from "@/store";
import { getDesignerOrdersThunk } from "@/store/slices/orderSlice";
import { useRouter } from "next/router";
import { displayTaskStatus } from "@/utils/taskStatusDisplay";

interface Column {
  id: string;
  label: string;
  align?: "left" | "center" | "right";
}

const tableHeader: Column[] = [
  { id: "party", label: "Party" },
  { id: "date", label: "Date" },
  { id: "size", label: "Size" },
  { id: "itemName", label: "Item Name" },
  { id: "remarks", label: "Remarks" },
  { id: "status", label: "Status", align: "center" as const },
];

// Status color mapping for designer status. Keyed on the display label
// (Seen/Working/Done/Rework) since `status` below is now the display value
// -- see displayTaskStatus.
const getDesignerStatusColor = (status: string) => {
  switch (status) {
    case "Seen":
      return { bg: "#E9D7FE", color: "#7F56D9" }; // Purple
    case "Working":
      return { bg: "#FEF0C7", color: "#B54708" }; // Orange
    case "Done":
      return { bg: "#D1FADF", color: "#027A48" }; // Green
    case "Rework":
      return { bg: "#FEE4E2", color: "#B42318" }; // Red
    default:
      return { bg: "#F2F4F7", color: "#667085" }; // Gray (default)
  }
};


const StatusBadge = ({ status }: { status: string }) => {
  const { bg, color } = getDesignerStatusColor(status);
  return (
    <Box
      sx={{
        backgroundColor: bg,
        color,
        fontSize: "12px",
        fontWeight: 500,
        borderRadius: "8px",
        px: 1.5,
        py: 0.5,
        display: "inline-block",
        textAlign: "center",
        width: "fit-content",
      }}
    >
      {status}
    </Box>
  );
};

interface DesignerTaskProps {
  tasks: Array<{
    _id: string;
    orderNumber: string;
    party?: {
      partyName: string;
    };
    createdAt: string;
    size?: string;
    productItem?: {
      itemName: string;
    };
    qty: number;
    remarks?: string;
    designerStatus: string;
  }>;
}

const DesignerTask : React.FC<DesignerTaskProps> = ({ tasks }) => {
  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);
  const router = useRouter();
  useEffect(() => {
    dispatch(getDesignerOrdersThunk());
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleRowClick = (orderId: string) => {
    router.push(`/admin/designer-task//view?id=${orderId}`);
  };


 

  // Transform orders data for table
  const rowData = tasks.map((order) => ({
    id: order._id,
    party: order.party?.partyName || "N/A",
    date: new Date(order.createdAt).toLocaleDateString(),
    size: order.size || "N/A",
    itemName: order.productItem?.itemName || "N/A",
    remarks: order.remarks || "N/A",
    status: order.designerStatus || "Pending",
    displayStatus: displayTaskStatus(order.designerStatus || "Pending"),
  }));

  const renderRow = (row: (typeof rowData)[number], index: number) => (
    <>
      <TableCell onClick={() => handleRowClick(row.id)}  sx={{ 
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.04)'
        }
      }} >{row.party}</TableCell>
      <TableCell>{row.date}</TableCell>
      <TableCell>{row.size}</TableCell>
      <TableCell>{row.itemName}</TableCell>
      <TableCell>{row.remarks}</TableCell>
      <TableCell align="center">
        <StatusBadge status={row.displayStatus} />
      </TableCell>
    </>
  );

  const csvColumns = [
    { id: "party", label: "Party", value: (row: (typeof rowData)[number]) => row.party },
    { id: "date", label: "Date", value: (row: (typeof rowData)[number]) => row.date },
    { id: "size", label: "Size", value: (row: (typeof rowData)[number]) => row.size },
    { id: "itemName", label: "Item Name", value: (row: (typeof rowData)[number]) => row.itemName },
    { id: "remarks", label: "Remarks", value: (row: (typeof rowData)[number]) => row.remarks },
    { id: "status", label: "Status", value: (row: (typeof rowData)[number]) => row.displayStatus },
  ];

  return (
    <BasicTable
      tableHeader={tableHeader}
      rowData={rowData}
      renderRow={renderRow}
      showDatePicker={false}
      showSearch={false}
      showFillter={true}
      csvColumns={csvColumns}
      exportFilename="designer-task"
    />
  );
};

export default DesignerTask;