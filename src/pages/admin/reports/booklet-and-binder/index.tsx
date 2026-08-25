import React, { useEffect } from 'react';
import BasicTable from '@/component/common_component/Table/themetable';
import { Box, TableCell } from '@mui/material';
import { FaChevronRight } from 'react-icons/fa6';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllOrdersThunk, Order } from '@/store/slices/orderSlice';

// Full Figma slide scan Phase 3 (claude/full-figma-slide-scan.md, Theme 6):
// same rebuild as the Binder report (see that page's comments for the
// general approach -- getAllOrdersThunk, TAT Days = issuedDate ->
// receivedDate once Done, Job Amount = totalAmount).
//
// Paper info is a bit more indirect here specifically: the Booklet &
// Folder Binder assignment screen's standalone Sheet Used/Sheet Size/
// Paper Type/GSM inputs are commented out of the rendered form and
// replaced by a dynamic bookletPapers[] repeater shown only when the
// Pasting checkbox is on (see all-orders/view/booklet-folder/index.tsx).
// This report prefers the order's top-level fields (still present on the
// data model even though that particular form doesn't render them) and
// falls back to the first bookletPapers[] entry when those are empty.

const columns = [
  { id: 'orderNo', label: 'Order No' },
  { id: 'party', label: 'Party Name' },
  { id: 'item', label: 'Item Name' },
  { id: 'bookletBinder', label: 'Booklet Binder' },
  { id: 'received', label: 'Received' },
  { id: 'bindingDone', label: 'Binding Done' },
  { id: 'tatDays', label: 'TAT Days' },
  { id: 'sheetUsed', label: 'Sheet Used' },
  { id: 'paperType', label: 'Paper Type' },
  { id: 'gsm', label: 'GSM' },
  { id: 'size', label: 'Size' },
  { id: 'jobAmount', label: 'Job Amount' },
];

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '-');

const tatDays = (issuedDate?: string, receivedDate?: string, status?: string) => {
  if (status !== 'Done' || !issuedDate || !receivedDate) return '-';
  const diffMs = new Date(receivedDate).getTime() - new Date(issuedDate).getTime();
  if (Number.isNaN(diffMs)) return '-';
  return String(Math.max(0, Math.round(diffMs / 86400000)));
};

const toRow = (order: Order) => {
  const firstPaper = order.bookletPapers?.[0];
  return {
    id: order._id,
    orderNo: order.orderNumber,
    party: order.party?.partyName || 'N/A',
    item: order.productItem?.itemName || 'N/A',
    bookletBinder: order.bookletBinder
      ? `${order.bookletBinder.firstName || ''} ${order.bookletBinder.lastName || ''}`.trim() || 'N/A'
      : 'N/A',
    received: formatDate(order.issuedDate),
    bindingDone: order.bookletBinderStatus === 'Done' ? formatDate(order.receivedDate) : '-',
    tatDays: tatDays(order.issuedDate, order.receivedDate, order.bookletBinderStatus),
    sheetUsed: order.numberOfSheetUsed || firstPaper?.numberOfSheetUsed || firstPaper?.numberOfSheetsUsed || '-',
    paperType: order.paperType || firstPaper?.paperType || '-',
    gsm: order.gsm || firstPaper?.gsm || '-',
    size: order.size || '-',
    jobAmount: order.totalAmount ? `₹${order.totalAmount}` : '-',
  };
};

const csvColumns = columns.map((c) => ({
  id: c.id,
  label: c.label,
  value: (row: ReturnType<typeof toRow>) => (row as any)[c.id],
}));

const BookletAndBinderReportPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);

  useEffect(() => {
    dispatch(getAllOrdersThunk({ limit: 1000 }));
  }, [dispatch]);

  const rows = orders.filter((o) => o.bookletBinderStatus).map(toRow);

  const handleRowClick = (row: ReturnType<typeof toRow>) => {
    router.push({
      pathname: '/admin/all-orders/view/booklet-folder',
      query: { id: row.id },
    });
  };

  return (
    <BasicTable
      tableHeader={columns}
      rowData={rows}
      csvColumns={csvColumns}
      exportFilename="booklet-and-binder-report"
      showFillter
      renderRow={(row) => (
        <>
          <TableCell>{row.orderNo}</TableCell>
          <TableCell>
            <Box sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(row)}>
              {row.party}
            </Box>
          </TableCell>
          <TableCell>{row.item}</TableCell>
          <TableCell>{row.bookletBinder}</TableCell>
          <TableCell>{row.received}</TableCell>
          <TableCell>{row.bindingDone}</TableCell>
          <TableCell>{row.tatDays}</TableCell>
          <TableCell>{row.sheetUsed}</TableCell>
          <TableCell>{row.paperType}</TableCell>
          <TableCell>{row.gsm}</TableCell>
          <TableCell>{row.size}</TableCell>
          <TableCell>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(row)}>
              <Box>{row.jobAmount}</Box>
              <FaChevronRight style={{ fontSize: 16, color: '#98A2B3', marginLeft: 8 }} />
            </Box>
          </TableCell>
        </>
      )}
    />
  );
};

export default BookletAndBinderReportPage;
