import React, { useEffect } from 'react';
import { Box, TableCell } from '@mui/material';
import BasicTable from '@/component/common_component/Table/themetable';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllOrdersThunk, Order } from '@/store/slices/orderSlice';
import { useRouter } from 'next/router';

// Full Figma slide scan Phase 6 (Theme 10, Slide 87): "My Orders" -- every
// order across BOTH companies where the logged-in staff member is assigned
// to any stage (Designer/Printer/Binder/Booklet Binder/Delivery) or created
// the order themselves. Deliberately spans companies (Slide 87's own mockup
// shows both Shakshi Creation and Quality Packaging rows for the same
// staff member) -- this is "my work", not scoped to whichever company the
// header toggle happens to be on.
//
// "Remarks" has no single obvious source once an order can be at any
// stage: shows the remark for whichever stage this specific staff member
// is assigned to on that order (falling back through stages in pipeline
// order), not a generic/first-available remark field.

const columns = [
  { id: 'company', label: 'Company' },
  { id: 'party', label: 'Party' },
  { id: 'orderNo', label: 'Order No.' },
  { id: 'date', label: 'Date' },
  { id: 'itemName', label: 'Item Name' },
  { id: 'size', label: 'Size' },
  { id: 'remarks', label: 'Remarks' },
];

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString() : '-');

const remarksForStaff = (order: Order, staffId: string): string => {
  if (order.designer?._id === staffId) return order.designerRemarks || '-';
  if (order.printer?._id === staffId) return order.printerRemarks || '-';
  if (order.binder?._id === staffId) return order.binderRemarks || '-';
  if (order.bookletBinder?._id === staffId) return order.bookletBinderRemarks || '-';
  if (order.deliveryStaff?._id === staffId) return order.remarks || '-';
  return order.remarks || '-';
};

const toRow = (order: Order, staffId: string) => ({
  id: order._id,
  company: order.companyName?.companyName || 'N/A',
  party: order.party?.partyName || 'N/A',
  orderNo: order.orderNumber,
  date: formatDate(order.createdAt),
  itemName: order.productItem?.itemName || 'N/A',
  size: order.size || '-',
  remarks: remarksForStaff(order, staffId),
});

const csvColumns = columns.map((c) => ({
  id: c.id,
  label: c.label,
  value: (row: ReturnType<typeof toRow>) => (row as any)[c.id],
}));

const MyOrdersPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { orders, loading } = useAppSelector((state) => state.orders);
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // No companyName filter -- My Orders deliberately spans both companies
    // (see the comment above).
    dispatch(getAllOrdersThunk({ limit: 1000 }));
  }, [dispatch]);

  const staffId = user?.id || '';

  const myOrders = orders.filter(
    (o) =>
      o.designer?._id === staffId ||
      o.printer?._id === staffId ||
      o.binder?._id === staffId ||
      o.bookletBinder?._id === staffId ||
      o.deliveryStaff?._id === staffId ||
      o.createdBy?._id === staffId
  );

  const rows = myOrders.map((o) => toRow(o, staffId));

  const handleRowClick = (row: ReturnType<typeof toRow>) => {
    // Generic read-only order detail page (view/index.tsx) -- deliberately
    // not one of the stage-specific view pages (view/binder, view/designer,
    // etc.), since a My Orders row can belong to any stage depending on
    // which assignment matched this staff member.
    router.push({ pathname: '/admin/all-orders/view', query: { id: row.id } });
  };

  return (
    <BasicTable
      tableHeader={columns}
      rowData={rows}
      csvColumns={csvColumns}
      exportFilename="my-orders"
      showFillter={false}
      renderRow={(row) => (
        <>
          <TableCell>{row.company}</TableCell>
          <TableCell>
            <Box sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(row)}>
              {row.party}
            </Box>
          </TableCell>
          <TableCell>{row.orderNo}</TableCell>
          <TableCell>{row.date}</TableCell>
          <TableCell>{row.itemName}</TableCell>
          <TableCell>{row.size}</TableCell>
          <TableCell>{row.remarks}</TableCell>
        </>
      )}
    />
  );
};

export default MyOrdersPage;
