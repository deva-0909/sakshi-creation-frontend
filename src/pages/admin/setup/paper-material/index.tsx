import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TableCell,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import BasicTable from '@/component/common_component/Table/themetable';
import Input from '@/component/common_component/themeinput';
import Select from '@/component/common_component/themeselect';
import Button from '@/component/common_component/themebutton';
import ThemeChip from '@/component/common_component/themechip';
import CustomDialog from '@/component/customdialog';
import AddNewMaterialBulkDialog from '@/component/AddNewMaterialBulkDialog';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  getAllMaterialsThunk,
  createMaterialThunk,
  updateMaterialThunk,
  deleteMaterialThunk,
  clearError,
} from '@/store/slices/materialSlice';
import { getAllUomsThunk } from '@/store/slices/uomSlice';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';

const STATUSES = ['Active', 'Inactive'];
const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: '#D1FADF', color: '#027A48' },
  Inactive: { bg: '#FEE4E2', color: '#B42318' },
};

interface MaterialForm {
  materialName: string;
  materialSize: string;
  materialGSM: string;
  uom: string;
  status: string;
}

const columns = [
  { id: 'id', label: 'ID' },
  { id: 'materialName', label: 'Material Name' },
  { id: 'materialSize', label: 'Size' },
  { id: 'materialGSM', label: 'GSM' },
  { id: 'uom', label: 'UOM' },
  { id: 'status', label: 'Status' },
  { id: 'action', label: 'Actions' },
];

const MaterialPage = () => {
  const dispatch = useAppDispatch();
  const { materials, loading, error } = useAppSelector((state) => state.materials);
  const { uoms } = useAppSelector((state) => state.uoms);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<MaterialForm>({
    materialName: '',
    materialSize: '',
    materialGSM: '',
    uom: '',
    status: 'Active',
  });

  useEffect(() => {
    dispatch(getAllMaterialsThunk())
      .unwrap()
      .catch((err) => toast.error(err));
    dispatch(getAllUomsThunk(undefined));
  }, [dispatch]);

  const handleOpenDialog = (material?: any) => {
    if (material) {
      setEditId(material._id);
      setForm({
        materialName: material.materialName,
        materialSize: material.materialSize,
        materialGSM: material.materialGSM.toString(),
        uom: material.uom?.id || material.uom?._id || '',
        status: material.status || 'Active',
      });
    } else {
      setEditId(null);
      setForm({ materialName: '', materialSize: '', materialGSM: '', uom: '', status: 'Active' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.materialName.trim() || !form.materialSize.trim() || !form.materialGSM.trim()) {
      toast.error('Please fill all required fields');
      return;
    }

    const materialGSM = parseInt(form.materialGSM);
    if (isNaN(materialGSM) || materialGSM <= 0) {
      toast.error('GSM must be a valid positive number');
      return;
    }

    try {
      if (editId) {
        await dispatch(
          updateMaterialThunk({
            id: editId,
            data: {
              materialName: form.materialName,
              materialSize: form.materialSize,
              materialGSM,
              uom: form.uom || undefined,
              status: form.status,
            },
          })
        ).unwrap();
        toast.success('Material updated successfully');
      } else {
        await dispatch(
          createMaterialThunk({
            materialName: form.materialName,
            materialSize: form.materialSize,
            materialGSM,
            uom: form.uom || undefined,
            status: form.status,
          })
        ).unwrap();
        toast.success('Material created successfully');
      }
      setDialogOpen(false);
      setForm({ materialName: '', materialSize: '', materialGSM: '', uom: '', status: 'Active' });
      setEditId(null);
    } catch (err: any) {
      toast.error(err || 'Failed to save material');
    }
  };

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
        dispatch(deleteMaterialThunk(id))
          .unwrap()
          .then(() => {
            toast.success(`${name} has been deleted.`);
          })
          .catch((err) => {
            toast.error(err || 'Failed to delete material');
          });
      }
    });
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600}>
          Paper Material
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ borderRadius: 2, fontWeight: 600, mr: 2, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
          >
            New Material
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setBulkDialogOpen(true)}
            sx={{ borderRadius: 2, fontWeight: 600, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
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
        rowData={materials.map((m: any) => ({ ...m, id: m._id }))}
        renderRow={(row: any, idx: number) => (
          <>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>{row.materialName}</TableCell>
            <TableCell>{row.materialSize}</TableCell>
            <TableCell>{row.materialGSM}</TableCell>
            <TableCell>{row.uom ? `${row.uom.name}${row.uom.symbol ? ` (${row.uom.symbol})` : ''}` : '-'}</TableCell>
            <TableCell>
              <ThemeChip label={row.status || 'Active'} sx={{ background: statusColor[row.status || 'Active']?.bg, color: statusColor[row.status || 'Active']?.color, fontWeight: 600 }} />
            </TableCell>
            <TableCell>
              <IconButton color="primary" onClick={() => handleOpenDialog(row)}>
                <Edit />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => handleDelete(row._id, row.materialName)}
              >
                <Delete />
              </IconButton>
            </TableCell>
          </>
        )}
      />
      <CustomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editId ? 'Edit Material' : 'New Material'}
        maxWidth="xs"
        fullWidth
      >
        <Input
          labelName="Material Name"
          value={form.materialName}
          onChange={(e: any) =>
            setForm((f) => ({ ...f, materialName: e.target.value }))
          }
          fullWidth
          required
          sx={{ mb: 2, mt: 1 }}
        />
        <Input
          labelName="Material Size"
          value={form.materialSize}
          onChange={(e: any) =>
            setForm((f) => ({ ...f, materialSize: e.target.value }))
          }
          fullWidth
          required
          sx={{ mb: 2 }}
        />
        <Input
          labelName="Material GSM"
          value={form.materialGSM}
          onChange={(e: any) =>
            setForm((f) => ({ ...f, materialGSM: e.target.value }))
          }
          fullWidth
          required
          type="number"
          sx={{ mb: 2 }}
        />
        <Box mb={2}>
          <Select
            label="Unit of Measure (optional)"
            options={uoms.map((u: any) => ({ label: u.symbol ? `${u.name} (${u.symbol})` : u.name, value: u._id }))}
            value={form.uom ? { label: uoms.find((u: any) => u._id === form.uom)?.name || '', value: form.uom } : null}
            onChange={(_, v) => setForm((f) => ({ ...f, uom: v ? String(v.value) : '' }))}
          />
        </Box>
        <Box mb={2}>
          <Select
            label="Status"
            options={STATUSES.map((s) => ({ label: s, value: s }))}
            value={form.status ? { label: form.status, value: form.status } : null}
            onChange={(_, v) => setForm((f) => ({ ...f, status: v ? String(v.value) : 'Active' }))}
          />
        </Box>
        <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
          <Button
            onClick={() => setDialogOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, borderColor: '#A409F8', color: '#A409F8', '&:hover': { borderColor: '#7B06C2', color: '#7B06C2' } }}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            sx={{ borderRadius: 2, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
            disabled={loading}
          >
            Save
          </Button>
        </Box>
      </CustomDialog>
      <AddNewMaterialBulkDialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        refreshData={() => dispatch(getAllMaterialsThunk())}
      />
    </Box>
  );
};

export default MaterialPage;