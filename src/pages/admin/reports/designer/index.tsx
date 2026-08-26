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
// following the same pattern already used for the Binder and Booklet &
// Binder reports -- there's no dedicated "designer report" backend
// endpoint, so this reuses getAllOrdersThunk like every other report page.
//
// Column mapping decisions (no 1:1 backend field for a few of these):
// - "Received" = issuedDate, matching the Binder/Booklet Binder reports'
//   own "Received" column.
// - "Sent for approval" = the earliest uploaded design file's timestamp
//   (designFiles[0].uploadedAt) -- the first proof sent out for the
//   party's approval.
// - "Approval Received" = receivedDate, once designerStatus is Done --
//   same "stage-assigned -> stage-marked-Done" convention as the other
//   stage reports.
// - "Final Print file" = the most recently uploaded design file's
//   timestamp (last entry in designFiles) -- there is no separate
//   "finalized" flag on the order, so the latest uploaded file is used.

const columns = [
  { id: 'received', label: 'Received' },
  { id: 'party', label: 'Party Name' },
  { id: 'designer', label: 'Designer' },
  { id: 'orderNo', label: 'Order No' },
  { id: 'item', label: 'Item Name' },
  { id: 'sentForApproval', label: 'Sent for approval' },
  { id: 'approvalReceived', label: 'Approval Received' },
  { id: 'finalPrintFile', label: 'Final Print file' },
];

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString() : '-');

const toRow = (order: Order) => ({
  id: order._id,
  received: formatDateTime(order.issuedDate),
  party: order.party?.partyName || 'N/A',
  designer: order.designer ? `${order.designer.firstName || ''} ${order.designer.lastName || ''}`.trim() || 'N/A' : 'N/A',
  orderNo: order.orderNumber,
  item: order.productItem?.itemName || 'N/A',
  sentForApproval: order.designFiles?.[0]?.uploadedAt ? formatDateTime(order.designFiles[0].uploadedAt) : '-',
  approvalReceived: order.designerStatus === 'Done' ? formatDateTime(order.receivedDate) : '-',
  finalPrintFile: order.designFiles?.length ? formatDateTime(order.designFiles[order.designFiles.length - 1].uploadedAt) : '-',
});

const csvColumns = columns.map((c) => ({
  id: c.id,
  label: c.label,
  value: (row: ReturnType<typeof toRow>) => (row as any)[c.id],
}));

const DesignerPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  useEffect(() => {
    dispatch(getAllOrdersThunk({ limit: 1000, companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  // Only orders that have actually reached the Designer stage -- an order
  // with no designerStatus was never assigned to a designer at all.
  const rows = orders.filter((o) => o.designerStatus).map(toRow);

  const handleRowClick = (row: ReturnType<typeof toRow>) => {
    router.push({
      pathname: '/admin/all-orders/view/designer',
      query: { id: row.id },
    });
  };

  return (
    <BasicTable
      tableHeader={columns}
      rowData={rows}
      csvColumns={csvColumns}
      exportFilename="designer"
      showFillter
      renderRow={(row) => (
        <>
          <TableCell>{row.received}</TableCell>
          <TableCell>
            <Box sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(row)}>
              {row.party}
            </Box>
          </TableCell>
          <TableCell>
            <Box sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(row)}>
              {row.designer}
            </Box>
          </TableCell>
          <TableCell>{row.orderNo}</TableCell>
          <TableCell>{row.item}</TableCell>
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
  );
};

export default DesignerPage;
