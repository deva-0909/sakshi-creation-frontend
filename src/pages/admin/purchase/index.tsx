import React, { useEffect, useState } from 'react';
import { Box, TableCell, IconButton } from '@mui/material';
import { Edit, Delete, CloudUpload } from '@mui/icons-material';
import ThemeButton from '@/component/common_component/themebutton';
import BasicTable from '@/component/common_component/Table/themetable';
import { useRouter } from 'next/router';
import { useAppDispatch, useAppSelector } from '@/store';
import { getAllPurchasesThunk, deletePurchaseThunk } from '@/store/slices/purchaseSlice';
import { getAllVendorsThunk } from '@/store/slices/vendorSlice';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';
import AddNewPurchaseBulkDialog from '@/component/AddNewPurchaseBulkDialog';

const columns = [
  { id: 'vendor', label: 'VENDOR' },
  { id: 'billNumber', label: 'BILL NUMBER' },
  { id: 'material', label: 'MATERIAL' },
  { id: 'size', label: 'SIZE' },
  { id: 'qty', label: 'QTY' },
  { id: 'gsm', label: 'GSM' },
  { id: 'rate', label: 'RATE / SHEET/UNIT' },
  { id: 'kg', label: 'KG' },
  { id: 'forValue', label: 'FOR' },
  { id: 'actions', label: 'ACTIONS' },
];

const PurchasePage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { purchases, loading } = useAppSelector((state) => state.purchase);
  // Two-company support (claude/two-company-gap-analysis.md, Phase 0):
  // scopes purchases to the globally-selected company; undefined (no
  // toggle yet, or only one company exists) keeps the pre-toggle
  // "all companies" list.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);
  const [openBulkUploadDialog, setOpenBulkUploadDialog] = useState(false);

  useEffect(() => {
    dispatch(getAllPurchasesThunk(activeCompanyId ? { companyName: activeCompanyId } : undefined));
    // Mobile/toggle/seed audit (2026-08-26), Phase D: this was the one
    // unscoped call in this file -- used only for vendor-name resolution in
    // the table, but leaving it unscoped meant it fetched twice as much as
    // needed and could show a stale name from the other company.
    dispatch(getAllVendorsThunk({ companyName: activeCompanyId || undefined }));
  }, [dispatch, activeCompanyId]);

  const handleEdit = (id: string) => {
    router.push(`/admin/purchase/edit-purchase/${id}`);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7F56D9',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deletePurchaseThunk(id)).unwrap();
        toast.success('Purchase deleted successfully');
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete purchase');
      }
    }
  };

  const handleBulkUploadClick = () => {
    setOpenBulkUploadDialog(true);
  };

  const handleBulkUploadClose = () => {
    setOpenBulkUploadDialog(false);
  };

  const rows = purchases.map((purchase) => ({
    id: purchase._id,
    vendor: (typeof purchase.vendorName === 'object' && purchase.vendorName?.name) || 'N/A',
    billNumber: purchase.billNumber,
    material: purchase.material?.materialName || 'N/A',
    size: purchase.material?.materialSize || 'N/A',
    qty: purchase.quantity,
    gsm: purchase.material?.materialGSM || 'N/A',
    rate: purchase.ratePerSheet,
    kg: purchase.kg,
    forValue: purchase.forCompany ? `${purchase.forCompany.firstName} ${purchase.forCompany.lastName}` : 'N/A',
    // Full Figma slide scan Phase 5 (Theme 9): BasicTable's Date Picker was
    // rendering (its showDatePicker prop defaults to true -- the original
    // scan's "no date/search/filter controls at all" was wrong) but any
    // date picked filtered out every row, since it compares against
    // row.date/row.createdDate, which this list never provided.
    date: purchase.createdAt,
  }));

  const csvColumns = [
    { id: 'vendor', label: 'VENDOR', value: (row: typeof rows[number]) => row.vendor },
    { id: 'billNumber', label: 'BILL NUMBER', value: (row: typeof rows[number]) => row.billNumber },
    { id: 'material', label: 'MATERIAL', value: (row: typeof rows[number]) => row.material },
    { id: 'size', label: 'SIZE', value: (row: typeof rows[number]) => row.size },
    { id: 'qty', label: 'QTY', value: (row: typeof rows[number]) => row.qty },
    { id: 'gsm', label: 'GSM', value: (row: typeof rows[number]) => row.gsm },
    { id: 'rate', label: 'RATE / SHEET/UNIT', value: (row: typeof rows[number]) => row.rate },
    { id: 'kg', label: 'KG', value: (row: typeof rows[number]) => row.kg },
    { id: 'forValue', label: 'FOR', value: (row: typeof rows[number]) => row.forValue },
  ];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'end', alignItems: 'center', mb: 2 }}>
        <ThemeButton onClick={() => router.push('/admin/purchase/add-purchase')}>
          + Add New Purchase
        </ThemeButton>
        <ThemeButton sx={{m:2}} onClick={handleBulkUploadClick} startIcon={<CloudUpload />}>
          Bulk Upload
        </ThemeButton>
      </Box>

      <BasicTable
        tableHeader={columns}
        rowData={rows}
        csvColumns={csvColumns}
        exportFilename="purchases"
        renderRow={(row) => (
          <>
            <TableCell>{row.vendor}</TableCell>
            <TableCell>{row.billNumber}</TableCell>
            <TableCell>{row.material}</TableCell>
            <TableCell>{row.size}</TableCell>
            <TableCell>{row.qty}</TableCell>
            <TableCell>{row.gsm}</TableCell>
            <TableCell>{row.rate}</TableCell>
            <TableCell>{row.kg}</TableCell>
            <TableCell>{row.forValue}</TableCell>
            <TableCell>
              <IconButton onClick={() => handleEdit(row.id)} color="primary">
                <Edit />
              </IconButton>
              <IconButton onClick={() => handleDelete(row.id)} color="error">
                <Delete />
              </IconButton>
            </TableCell>
          </>
        )}
      />

        <AddNewPurchaseBulkDialog
        open={openBulkUploadDialog}
        onClose={handleBulkUploadClose}
        refreshData={() => dispatch(getAllPurchasesThunk(activeCompanyId ? { companyName: activeCompanyId } : undefined))}
      />
    </>
  );
};

export default PurchasePage;