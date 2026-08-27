import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TableCell,
  Stack,
} from '@mui/material';
import { Add, Edit, Delete, TrendingUp } from '@mui/icons-material';
import BasicTable from '@/component/common_component/Table/themetable';
import Input from '@/component/common_component/themeinput';
import Select from '@/component/common_component/themeselect';
import Button from '@/component/common_component/themebutton';
import ThemeChip from '@/component/common_component/themechip';
import CustomDialog from '@/component/customdialog';
import CompanySelect from '@/component/reusablecomponents/CompanyWithPartyName';
import AddNewVendorBulkDialog from '@/component/AddNewVendorBulkDialog';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  getAllVendorsThunk,
  createVendorThunk,
  updateVendorThunk,
  deleteVendorThunk,
  clearError,
  getVendorRateHistoryThunk,
  getVendorPerformanceThunk,
  clearVendorRateHistory,
} from '@/store/slices/vendorSlice';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const STATUSES = ['Active', 'Inactive'];
const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: '#D1FADF', color: '#027A48' },
  Inactive: { bg: '#FEE4E2', color: '#B42318' },
};

interface VendorForm {
  companyName: string;
  name: string;
  contactNumber: string;
  whatsappNumber: string;
  gst: string;
  address: string;
  // Module 9: optional payable credit limit, kept as a string in form state
  // (like every other Input here) and converted to a number on save.
  creditLimit: string;
  // Module 10: activation status, added to the pre-existing masters that had
  // no such concept before.
  status: string;
  // Module 11 Part B: banking/commercial terms, all optional.
  pan: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankName: string;
  paymentTerms: string;
  creditPeriodDays: string;
  vendorCategory: string;
}

const emptyVendorForm: VendorForm = {
  companyName: '',
  name: '',
  contactNumber: '',
  whatsappNumber: '',
  gst: '',
  address: '',
  creditLimit: '',
  status: 'Active',
  pan: '',
  bankAccountNumber: '',
  bankIfsc: '',
  bankName: '',
  paymentTerms: '',
  creditPeriodDays: '',
  vendorCategory: '',
};

const columns = [
  { id: 'id', label: 'ID' },
  { id: 'companyName', label: 'Company Name' },
  { id: 'name', label: 'Vendor Name' },
  { id: 'contactNumber', label: 'Contact Number' },
  { id: 'whatsappNumber', label: 'WhatsApp Number' },
  { id: 'gst', label: 'GST' },
  { id: 'address', label: 'Address' },
  { id: 'creditLimit', label: 'Credit Limit' },
  { id: 'status', label: 'Status' },
  { id: 'action', label: 'Actions' },
];

const csvColumns = [
  { id: 'companyName', label: 'Company Name', value: (row: any) => row.companyName?.companyName || 'N/A' },
  { id: 'name', label: 'Vendor Name', value: (row: any) => row.name },
  { id: 'contactNumber', label: 'Contact Number', value: (row: any) => row.contactNumber },
  { id: 'whatsappNumber', label: 'WhatsApp Number', value: (row: any) => row.whatsappNumber },
  { id: 'gst', label: 'GST', value: (row: any) => row.gst || 'N/A' },
  { id: 'address', label: 'Address', value: (row: any) => row.address },
  { id: 'creditLimit', label: 'Credit Limit', value: (row: any) => (row.creditLimit != null ? row.creditLimit : 'No limit') },
  { id: 'status', label: 'Status', value: (row: any) => row.status || 'Active' },
];

const VendorPage = () => {
  const dispatch = useAppDispatch();
  const { vendors, loading, error } = useAppSelector((state) => state.vendors);
  const { rateHistory, performance, rateHistoryLoading } = useAppSelector((state) => state.vendors);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: the Vendor master list
  // never read the company toggle -- always mixed both companies' vendors.
  const { activeCompanyId } = useAppSelector((state) => state.activeCompany);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<VendorForm>(emptyVendorForm);
  const [gstError, setGstError] = useState<string | null>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyVendor, setHistoryVendor] = useState<{ id: string; name: string } | null>(null);

  // Fetch vendors on component mount
  useEffect(() => {
    dispatch(getAllVendorsThunk({ companyName: activeCompanyId || undefined }))
      .unwrap()
      .catch((err) => toast.error(err));
  }, [dispatch, activeCompanyId]);

  // Open dialog for add or edit
  const handleOpenDialog = (vendor?: any) => {
    if (vendor) {
      setEditId(vendor._id);
      setForm({
        companyName: vendor.companyName?._id || vendor.companyName || '',
        name: vendor.name,
        contactNumber: vendor.contactNumber,
        whatsappNumber: vendor.whatsappNumber,
        gst: vendor.gst || '',
        address: vendor.address,
        creditLimit: vendor.creditLimit != null ? String(vendor.creditLimit) : '',
        status: vendor.status || 'Active',
        pan: vendor.pan || '',
        bankAccountNumber: vendor.bankAccountNumber || '',
        bankIfsc: vendor.bankIfsc || '',
        bankName: vendor.bankName || '',
        paymentTerms: vendor.paymentTerms || '',
        creditPeriodDays: vendor.creditPeriodDays != null ? String(vendor.creditPeriodDays) : '',
        vendorCategory: vendor.vendorCategory || '',
      });
      setGstError(null); // Reset GST error on open
    } else {
      setEditId(null);
      setForm(emptyVendorForm);
      setGstError(null); // Reset GST error on open
    }
    setDialogOpen(true);
  };

  const handleOpenHistory = (vendor: any) => {
    setHistoryVendor({ id: vendor._id, name: vendor.name });
    dispatch(getVendorRateHistoryThunk({ vendorId: vendor._id }));
    dispatch(getVendorPerformanceThunk(vendor._id));
    setHistoryDialogOpen(true);
  };

  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
    setHistoryVendor(null);
    dispatch(clearVendorRateHistory());
  };

  // GST validation function
  const validateGST = (gst: string): string | null => {
    if (!gst) return null; // GST is optional
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst)) {
      return 'GST number must be a valid 15-character GSTIN (e.g., 27AAAAA0000A1Z5)';
    }
    return null;
  };

  // Handle GST input change with validation
  const handleGstChange = (value: string) => {
    const upperCaseValue = value.toUpperCase();
    setForm((f) => ({ ...f, gst: upperCaseValue }));
    setGstError(validateGST(upperCaseValue));
  };

  // Save new or edited vendor
  const handleSave = async () => {
    if (
      !form.companyName.trim() ||
      !form.name.trim() ||
      !form.contactNumber.trim() ||
      !form.whatsappNumber.trim() ||
      !form.address.trim()
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    if (
      form.contactNumber.length !== 10 ||
      form.whatsappNumber.length !== 10
    ) {
      toast.error('Contact and WhatsApp numbers must be 10 digits');
      return;
    }

    if (form.gst && validateGST(form.gst)) {
      toast.error(validateGST(form.gst));
      return;
    }

    try {
      if (editId) {
        await dispatch(
          updateVendorThunk({
            id: editId,
            data: {
              companyName: form.companyName,
              name: form.name,
              contactNumber: form.contactNumber,
              whatsappNumber: form.whatsappNumber,
              gst: form.gst,
              address: form.address,
              creditLimit: form.creditLimit !== '' ? Number(form.creditLimit) : undefined,
              status: form.status,
              pan: form.pan || undefined,
              bankAccountNumber: form.bankAccountNumber || undefined,
              bankIfsc: form.bankIfsc || undefined,
              bankName: form.bankName || undefined,
              paymentTerms: form.paymentTerms || undefined,
              creditPeriodDays: form.creditPeriodDays !== '' ? Number(form.creditPeriodDays) : undefined,
              vendorCategory: form.vendorCategory || undefined,
            },
          })
        ).unwrap();
        toast.success('Vendor updated successfully');
      } else {
        await dispatch(
          createVendorThunk({
            companyName: form.companyName,
            name: form.name,
            contactNumber: form.contactNumber,
            whatsappNumber: form.whatsappNumber,
            gst: form.gst,
            address: form.address,
            creditLimit: form.creditLimit !== '' ? Number(form.creditLimit) : undefined,
            status: form.status,
            pan: form.pan || undefined,
            bankAccountNumber: form.bankAccountNumber || undefined,
            bankIfsc: form.bankIfsc || undefined,
            bankName: form.bankName || undefined,
            paymentTerms: form.paymentTerms || undefined,
            creditPeriodDays: form.creditPeriodDays !== '' ? Number(form.creditPeriodDays) : undefined,
            vendorCategory: form.vendorCategory || undefined,
          })
        ).unwrap();
        toast.success('Vendor created successfully');
      }
      setDialogOpen(false);
      setForm(emptyVendorForm);
      setEditId(null);
      setGstError(null);
    } catch (err: any) {
      toast.error(err || 'Failed to save vendor');
    }
  };

  // Delete vendor with confirmation
  const handleDelete = (id: string, name: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(deleteVendorThunk(id))
          .unwrap()
          .then(() => {
            toast.success(`${name} has been deleted.`);
          })
          .catch((err) => {
            toast.error(err || 'Failed to delete vendor');
          });
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Vendors
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, mr: 2, background: '#7F56D9', '&:hover': { background: '#53389E' } }}
          >
            New Vendor
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setBulkDialogOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 600, background: '#7F56D9', '&:hover': { background: '#53389E' } }}
          >
            Bulk Upload
          </Button>
        </Box>
      </Box>
      <BasicTable
        showFillter={false}
        showDatePicker={false}
        showSearch={false}
        tableHeader={columns}
        rowData={vendors.map((v: any) => ({ ...v, id: v._id }))}
        csvColumns={csvColumns}
        exportFilename="vendors"
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.companyName?.companyName || 'N/A'}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.contactNumber}</TableCell>
            <TableCell>{row.whatsappNumber}</TableCell>
            <TableCell>{row.gst || 'N/A'}</TableCell>
            <TableCell>{row.address}</TableCell>
            <TableCell>{row.creditLimit != null ? row.creditLimit : 'No limit'}</TableCell>
            <TableCell>
              <ThemeChip label={row.status || 'Active'} sx={{ background: statusColor[row.status || 'Active']?.bg, color: statusColor[row.status || 'Active']?.color, fontWeight: 600 }} />
            </TableCell>
            <TableCell>
              <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                <Edit />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => handleDelete(row._id, row.name)}
              >
                <Delete />
              </IconButton>
              <IconButton
                onClick={() => handleOpenHistory(row)}
                title="Rate History & Performance"
              >
                <TrendingUp />
              </IconButton>
            </TableCell>
          </>
        )}
      />

      {/* Add/Edit Dialog */}
      <CustomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editId ? 'Edit Vendor' : 'New Vendor'}
        maxWidth="md"
        fullWidth
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <CompanySelect
            name="companyName"
            value={form.companyName}
            onChange={(event, newValue) => {
              setForm((f) => ({ ...f, companyName: newValue ? newValue.value : '' }));
            }}
            required
          />
          <Input
            labelName="Vendor Name"
            value={form.name}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            fullWidth
            required
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Input
            labelName="Contact Number"
            value={form.contactNumber}
            onChange={(e: any) =>
              setForm((f) => ({
                ...f,
                contactNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
              }))
            }
            fullWidth
            required
            sx={{ flex: 1 }}
          />
          <Input
            labelName="WhatsApp Number"
            value={form.whatsappNumber}
            onChange={(e: any) =>
              setForm((f) => ({
                ...f,
                whatsappNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
              }))
            }
            fullWidth
            required
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Input
            labelName="GST Number"
            value={form.gst}
            onChange={(e: any) => handleGstChange(e.target.value)}
            fullWidth
            error={!!gstError}
            helperText={gstError}
            sx={{ flex: 1 }}
          />
          <Input
            labelName="Address"
            value={form.address}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, address: e.target.value }))
            }
            fullWidth
            required
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Input
            labelName="Credit Limit (optional)"
            type="number"
            value={form.creditLimit}
            onChange={(e: any) =>
              setForm((f) => ({ ...f, creditLimit: e.target.value }))
            }
            fullWidth
            sx={{ flex: 1 }}
          />
          <Box sx={{ flex: 1 }}>
            <Select
              label="Status"
              options={STATUSES.map((s) => ({ label: s, value: s }))}
              value={form.status ? { label: form.status, value: form.status } : null}
              onChange={(_, v) => setForm((f) => ({ ...f, status: v ? String(v.value) : 'Active' }))}
            />
          </Box>
        </Stack>
        {/* Module 11 Part B: banking/commercial terms -- all optional. */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Input
            labelName="PAN (optional)"
            value={form.pan}
            onChange={(e: any) => setForm((f) => ({ ...f, pan: e.target.value.toUpperCase() }))}
            fullWidth
            sx={{ flex: 1 }}
          />
          <Input
            labelName="Vendor Category (optional)"
            value={form.vendorCategory}
            onChange={(e: any) => setForm((f) => ({ ...f, vendorCategory: e.target.value }))}
            fullWidth
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Input
            labelName="Bank Account Number (optional)"
            value={form.bankAccountNumber}
            onChange={(e: any) => setForm((f) => ({ ...f, bankAccountNumber: e.target.value }))}
            fullWidth
            sx={{ flex: 1 }}
          />
          <Input
            labelName="Bank IFSC (optional)"
            value={form.bankIfsc}
            onChange={(e: any) => setForm((f) => ({ ...f, bankIfsc: e.target.value.toUpperCase() }))}
            fullWidth
            sx={{ flex: 1 }}
          />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Input
            labelName="Bank Name (optional)"
            value={form.bankName}
            onChange={(e: any) => setForm((f) => ({ ...f, bankName: e.target.value }))}
            fullWidth
            sx={{ flex: 1 }}
          />
          <Input
            labelName="Payment Terms (optional, e.g. Net 30)"
            value={form.paymentTerms}
            onChange={(e: any) => setForm((f) => ({ ...f, paymentTerms: e.target.value }))}
            fullWidth
            sx={{ flex: 1 }}
          />
          <Input
            labelName="Credit Period (days, optional)"
            type="number"
            value={form.creditPeriodDays}
            onChange={(e: any) => setForm((f) => ({ ...f, creditPeriodDays: e.target.value }))}
            fullWidth
            sx={{ flex: 1 }}
          />
        </Stack>
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: '#7F56D9', color: '#7F56D9', '&:hover': { borderColor: '#53389E', color: '#53389E' } }}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ borderRadius: 2, background: '#7F56D9', '&:hover': { background: '#53389E' } }}
            disabled={loading || !!gstError}
          >
            Save
          </Button>
        </Box>
      </CustomDialog>
      <AddNewVendorBulkDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        refreshData={() => dispatch(getAllVendorsThunk({ companyName: activeCompanyId || undefined }))}
      />

      {/* Module 11 Part B: live-computed rate history + on-time-delivery
          performance -- no separate table, read straight from PO/GRN data. */}
      <CustomDialog open={historyDialogOpen} onClose={handleCloseHistory} title={historyVendor ? `${historyVendor.name} -- Rate History & Performance` : ''} maxWidth="md" fullWidth>
        {rateHistoryLoading ? (
          <Typography fontSize={14} color="text.secondary" py={2}>
            Loading...
          </Typography>
        ) : (
          <Box py={1}>
            <Typography fontWeight={600} mb={1}>
              On-Time Delivery Performance
            </Typography>
            {performance && performance.totalDeliveries > 0 ? (
              <Stack direction="row" spacing={4} mb={3} flexWrap="wrap" useFlexGap>
                <Typography fontSize={14}>Total Deliveries: {performance.totalDeliveries}</Typography>
                <Typography fontSize={14} color="success.main">On Time: {performance.onTimeCount}</Typography>
                <Typography fontSize={14} color="error.main">Late: {performance.lateCount}</Typography>
                <Typography fontSize={14} fontWeight={700}>On-Time %: {performance.onTimePercentage}%</Typography>
                <Typography fontSize={14}>Avg. Delay: {performance.averageDelayDays} days</Typography>
              </Stack>
            ) : (
              <Typography fontSize={14} color="text.secondary" mb={3}>
                No deliveries recorded yet for this vendor.
              </Typography>
            )}

            <Typography fontWeight={600} mb={1}>
              Rate History
            </Typography>
            {rateHistory.length === 0 ? (
              <Typography fontSize={14} color="text.secondary">
                No purchase order lines recorded yet for this vendor.
              </Typography>
            ) : (
              <BasicTable
                showFillter={false}
                showDatePicker={false}
                showSearch={false}
                tableHeader={[
                  { id: 'material', label: 'Material' },
                  { id: 'rate', label: 'Rate' },
                  { id: 'quantity', label: 'Qty Ordered' },
                  { id: 'po', label: 'PO #' },
                  { id: 'orderedAt', label: 'Ordered' },
                ]}
                rowData={rateHistory.map((r, idx) => ({ ...r, id: String(idx) }))}
                renderRow={(row: any) => (
                  <>
                    <TableCell>{row.material?.materialName || '-'}</TableCell>
                    <TableCell>{row.rate}</TableCell>
                    <TableCell>{row.quantityOrdered}</TableCell>
                    <TableCell>{row.purchaseOrder?.poNumber || '-'}</TableCell>
                    <TableCell>{row.orderedAt ? new Date(row.orderedAt).toLocaleDateString() : '-'}</TableCell>
                  </>
                )}
              />
            )}
          </Box>
        )}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <Button onClick={handleCloseHistory} variant="outlined" sx={{ borderRadius: 2, borderColor: '#7F56D9', color: '#7F56D9', '&:hover': { borderColor: '#53389E', color: '#53389E' } }}>
            Close
          </Button>
        </Box>
      </CustomDialog>
    </Box>
  );
};

export default VendorPage;