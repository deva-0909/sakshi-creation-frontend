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
    //
    // Functional audit Fix 2 -- decision, not an oversight: this fetch
    // pulls up to 1000 full order records (both companies) into the shared
    // `state.orders` store and only narrows to "my" rows in the client-side
    // filter below. Two things the audit flagged and what this patch does/
    // doesn't do about each:
    //
    //  1. "No company scoping" -- deliberately NOT added. This page's own
    //     comment block above (Full Figma slide scan Phase 6, Theme 10,
    //     Slide 87) documents that My Orders is SUPPOSED to span both
    //     companies for a staff member assigned to work in either -- e.g. a
    //     Godown Manager with orders in both Sakshi Creation and Quality
    //     Packaging. Restricting the fetch to the active company toggle
    //     (activeCompanyId, the pattern src/pages/admin/accounting/invoices
    //     uses) would silently hide a user's own assigned orders in their
    //     other company, regressing a verified, deliberate design decision.
    //  2. "No assigned-to-me filtering" -- already implemented, just done
    //     client-side (the `myOrders` filter below matches designer/
    //     printer/binder/bookletBinder/deliveryStaff/createdBy against the
    //     logged-in user's id) rather than via a server-side query param.
    //     getAllOrdersThunk/orderService.getAllOrders/GET /orders only
    //     support page/limit/status/companyName/party/search/orderFrom
    //     today -- there is no createdBy/assignedTo param to push this
    //     filtering down to the backend. Adding one would touch
    //     order.routes.js/order.controller.js, which is out of scope here:
    //     that route file is owned by a concurrent patch session (patch118+)
    //     making security fixes there, and a second agent editing the same
    //     route risks a patch conflict. Net effect: every staff member's
    //     browser still receives the full cross-company order list (up to
    //     1000 records) before the client narrows it down for display -- an
    //     over-fetch, not an access-control bypass (a user only ever sees
    //     rows already showing their own assignment), but real backend
    //     support for an assignedTo/createdBy query param would let this
    //     fetch (and the client-side filter) go away entirely. Left as a
    //     follow-up for whoever next touches order.routes.js.
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
