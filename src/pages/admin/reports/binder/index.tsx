import React, { useEffect } from 'react';
import BasicTable from '@/component/common_component/Table/themetable';
import { Box, TableCell } from '@mui/material';
import { FaChevronRight } from 'react-icons/fa6';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllOrdersThunk, Order } from '@/store/slices/orderSlice';

// Full Figma slide scan Phase 3 (claude/full-figma-slide-scan.md, Theme 6):
// this page previously rendered 3 hardcoded mock rows with a different
// column set entirely. Rebuilt from real order data -- there's no
// dedicated "binder report" backend endpoint, so this reuses the same
// getAllOrdersThunk every other list page calls (limit raised well past
// the All Orders page's own 100, since a report should aim to cover
// everything rather than the most recent page; there's no unpaginated
// escape hatch on this endpoint, see order.controller.js).
//
// Column mapping decisions (no 1:1 backend field for a couple of these):
// - "Received" = issuedDate, "Binding Done" = receivedDate once
//   binderStatus is Done -- these are the same two fields the Binder
//   assignment screen itself already collects (view/binder/index.tsx).
// - "TAT Days" = receivedDate - issuedDate, per the user's decision
//   (stage-assigned -> stage-marked-Done), only shown once Done.
// - "Paper Type" has no dedicated field on the order for the Binder
//   stage (only Printer/Booklet Binder have one) -- "Sub Paper" is the
//   closest available field and is used here; noted so it isn't
//   mistaken for a real 1:1 match.
// - "Job Amount" = totalAmount, the figure already captured on this
//   same order at the Binder stage.

const columns = [
  { id: 'orderNo', label: 'Order No' },
  { id: 'party', label: 'Party Name' },
  { id: 'item', label: 'Item Name' },
  { id: 'binder', label: 'Binder' },
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

const toRow = (order: Order) => ({
  id: order._id,
  orderNo: order.orderNumber,
  party: order.party?.partyName || 'N/A',
  item: order.productItem?.itemName || 'N/A',
  binder: order.binder ? `${order.binder.firstName || ''} ${order.binder.lastName || ''}`.trim() || 'N/A' : 'N/A',
  received: formatDate(order.issuedDate),
  bindingDone: order.binderStatus === 'Done' ? formatDate(order.receivedDate) : '-',
  tatDays: tatDays(order.issuedDate, order.receivedDate, order.binderStatus),
  sheetUsed: order.usedPaper || '-',
  paperType: order.subPaper || '-',
  gsm: order.gsm || '-',
  size: order.size || '-',
  jobAmount: order.totalAmount ? `₹${order.totalAmount}` : '-',
});

const csvColumns = columns.map((c) => ({
  id: c.id,
  label: c.label,
  value: (row: ReturnType<typeof toRow>) => (row as any)[c.id],
}));

const BinderReportPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: the thunk already
  // supported companyName -- this report just never passed it, so it
  // always mixed both companies' binder-stage orders together.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);

  useEffect(() => {
    dispatch(getAllOrdersThunk({ limit: 1000, companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  // Only orders that have actually reached the Binder stage -- an order
  // with no binderStatus was never assigned to a binder at all.
  const rows = orders.filter((o) => o.binderStatus).map(toRow);

  const handleRowClick = (row: ReturnType<typeof toRow>) => {
    router.push({
      pathname: '/admin/all-orders/view/binder',
      query: { id: row.id },
    });
  };

  return (
    <BasicTable
      tableHeader={columns}
      rowData={rows}
      csvColumns={csvColumns}
      exportFilename="binder-report"
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
          <TableCell>{row.binder}</TableCell>
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

export default BinderReportPage;
