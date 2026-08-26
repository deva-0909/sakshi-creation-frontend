import React, { useEffect } from 'react';
import BasicTable from '@/component/common_component/Table/themetable';
import { Box, TableCell } from '@mui/material';
import { FaChevronRight } from 'react-icons/fa6';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllOrdersThunk, Order } from '@/store/slices/orderSlice';

// Mobile/toggle/seed audit (2026-08-26), Phase G: this page previously
// rendered 3 hardcoded mock rows (Mr. Shah / Mr. Roy / Mr. Akash) that never
// changed no matter what was in the database. Rebuilt from real order data,
// following the same pattern as the Designer/Binder/Booklet Binder reports.
//
// Column mapping decisions (no 1:1 backend field for a few of these):
// - "Received" = issuedDate, "Sent for approval" = the first uploaded
//   printer file's timestamp, "Approval Received" = receivedDate once
//   printerStatus is Done, "Final Print file" = the most recently
//   uploaded printer file's timestamp -- same conventions used for the
//   Designer report's equivalent columns.
// - "Balance" has no corresponding order field anywhere in the schema
//   (no outstanding-amount or remaining-sheets figure is tracked at the
//   Printer stage) -- shown as "-" rather than inventing a number. Flagged
//   in the remediation plan as a real product gap, not a wiring gap.

const columns = [
  { id: 'received', label: 'Received' },
  { id: 'party', label: 'Party Name' },
  { id: 'printer', label: 'Printer' },
  { id: 'orderNo', label: 'Order No' },
  { id: 'item', label: 'Item Name' },
  { id: 'balance', label: 'Balance' },
  { id: 'sentForApproval', label: 'Sent for approval' },
  { id: 'approvalReceived', label: 'Approval Received' },
  { id: 'finalPrintFile', label: 'Final Print file' },
];

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '-');

const toRow = (order: Order) => ({
  id: order._id,
  received: formatDateTime(order.issuedDate),
  party: order.party?.partyName || 'N/A',
  printer: order.printer ? `${order.printer.firstName || ''} ${order.printer.lastName || ''}`.trim() || 'N/A' : 'N/A',
  orderNo: order.orderNumber,
  item: order.productItem?.itemName || 'N/A',
  balance: '-',
  sentForApproval: order.printerFiles?.[0]?.uploadedAt ? formatDateTime(order.printerFiles[0].uploadedAt) : '-',
  approvalReceived: order.printerStatus === 'Done' ? formatDateTime(order.receivedDate) : '-',
  finalPrintFile: order.printerFiles?.length ? formatDateTime(order.printerFiles[order.printerFiles.length - 1].uploadedAt) : '-',
});

const csvColumns = columns.map((c) => ({
  id: c.id,
  label: c.label,
  value: (row: ReturnType<typeof toRow>) => (row as any)[c.id],
}));

const PrintersPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  useEffect(() => {
    dispatch(getAllOrdersThunk({ limit: 1000, companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  // Only orders that have actually reached the Printer stage -- an order
  // with no printerStatus was never assigned to a printer at all.
  const rows = orders.filter((o) => o.printerStatus).map(toRow);

  const handleRowClick = (row: ReturnType<typeof toRow>) => {
    router.push({
      pathname: '/admin/all-orders/view/printers',
      query: { id: row.id },
    });
  };

  return (
    <>
      <BasicTable
        tableHeader={columns}
        rowData={rows}
        csvColumns={csvColumns}
        exportFilename="printers"
        showFillter
        renderRow={(row) => (
          <>
          <TableCell>{row.received}</TableCell>
            <TableCell>
              <Box
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(row)}
              >
                {row.party}
              </Box>
            </TableCell>
            <TableCell>
              <Box
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(row)}
              >
                {row.printer}
              </Box>
            </TableCell>
            <TableCell>{row.orderNo}</TableCell>
            <TableCell>{row.item}</TableCell>
            <TableCell>{row.balance}</TableCell>

            <TableCell>{row.sentForApproval}</TableCell>
            <TableCell>{row.approvalReceived}</TableCell>
            <TableCell>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(row)}
              >
                <Box>{row.finalPrintFile}</Box>
                <FaChevronRight style={{ fontSize: 16, color: '#98A2B3', marginLeft: 8 }} />
              </Box>
            </TableCell>
          </>
        )}
      />
    </>
  );
};

export default PrintersPage;
