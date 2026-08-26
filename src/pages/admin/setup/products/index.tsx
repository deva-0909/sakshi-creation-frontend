import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TableCell,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";
import { useSelector } from "react-redux";
import BasicTable from "@/component/common_component/Table/themetable";
import Input from "@/component/common_component/themeinput";
import Select from "@/component/common_component/themeselect";
import Button from "@/component/common_component/themebutton";
import ThemeChip from "@/component/common_component/themechip";
import CustomDialog from "@/component/customdialog";
import AddNewProductBulkDialog from "@/component/AddNewProductBulkDialog";
import {
  createProductItemThunk,
  getAllProductItemsThunk,
  updateProductItemThunk,
  deleteProductItemThunk,
  clearProductItemError,
  clearProductItemSuccessMessage,
} from "@/store/slices/productItemSlice";
import { getAllCompanyNamesThunk } from "@/store/slices/companyNameSlice";
import { RootState, useAppDispatch } from "@/store";
import { toast } from "react-toastify";

const STATUSES = ["Active", "Inactive"];
const statusColor: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#D1FADF", color: "#027A48" },
  Inactive: { bg: "#FEE4E2", color: "#B42318" },
};

interface ProductItem {
  _id: string;
  itemName: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  // Two-company Phase 1 (claude/two-company-gap-analysis.md): absent/null
  // means visible to every company (default/legacy behavior).
  companyName?: { _id: string; companyName: string } | null;
}

interface ProductItemRow extends ProductItem {
  id: string;
}

const columns = [
  { id: "id", label: "ID" },
  { id: "itemName", label: "Name" },
  { id: "company", label: "Company" },
  { id: "status", label: "Status" },
  { id: "options", label: "Options" },
];

const csvColumns = [
  { id: "itemName", label: "Name", value: (row: ProductItemRow) => row.itemName },
  { id: "company", label: "Company", value: (row: ProductItemRow) => row.companyName?.companyName || "All companies" },
  { id: "status", label: "Status", value: (row: ProductItemRow) => row.status || "Active" },
];

const ProductsPage = () => {
  const dispatch = useAppDispatch();
  const { productItems, loading, error, successMessage } = useSelector(
    (state: RootState) => state.productItems
  );
  // Two-company Phase 1 (claude/two-company-gap-analysis.md): lets a
  // product item optionally be scoped to one company's catalog (e.g.
  // Quality Packaging's "BOX") instead of visible to every company.
  const { companyNames } = useSelector((state: RootState) => state.companyNames);
  // Mobile/toggle/seed audit (2026-08-26), Phase D: the thunk already
  // supported companyName (tri-state) -- this page just never passed it,
  // so the list always showed every item from both companies plus shared
  // ones instead of this company's + shared.
  const { activeCompanyId } = useSelector((state: RootState) => state.activeCompany);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ itemName: "", status: "Active", companyName: "" });

  // Fetch all products on component mount
  useEffect(() => {
    dispatch(getAllProductItemsThunk({ companyName: activeCompanyId || undefined }));
    dispatch(getAllCompanyNamesThunk());
  }, [dispatch, activeCompanyId]);

  // Handle success and error messages
  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearProductItemSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearProductItemError());
    }
  }, [successMessage, error, dispatch]);

  // Open dialog for add or edit
  const handleOpenDialog = (product?: ProductItem) => {
    if (product) {
      setEditId(product._id);
      setForm({ itemName: product.itemName, status: product.status || "Active", companyName: product.companyName?._id || "" });
    } else {
      setEditId(null);
      setForm({ itemName: "", status: "Active", companyName: "" });
    }
    setDialogOpen(true);
  };

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, itemName: e.target.value }));
  };

  // Save new or edited product
  const handleSave = () => {
    if (!form.itemName.trim()) {
      toast.error("Product name is required");
      return;
    }

    const productData = {
      itemName: form.itemName,
      status: form.status,
      // Two-company Phase 1: always sent, even as "" ("All companies") --
      // the backend treats a present-but-empty value as an explicit
      // un-scope on update, and as "not scoped" on create. Omitting the
      // field entirely (undefined) is what "leave unchanged" means to the
      // update endpoint, which isn't what re-selecting "All companies" in
      // this dropdown is meant to do.
      companyName: form.companyName,
    };

    if (editId) {
      dispatch(updateProductItemThunk({ id: editId, data: productData }));
    } else {
      dispatch(createProductItemThunk(productData));
    }

    setDialogOpen(false);
    setForm({ itemName: "", status: "Active", companyName: "" });
    setEditId(null);
  };

  const handleDelete = (id: string) => {
    dispatch(deleteProductItemThunk(id));
  };

  return (
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5" fontWeight={600}>
            Products
          </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 600, mr: 2, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
          >
            New Product
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setBulkDialogOpen(true)}
            disabled={loading}
            sx={{ borderRadius: 2, fontWeight: 600, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
          >
            Bulk Upload
          </Button>
        </Box>
      </Box>
        <BasicTable
          tableHeader={columns}
          rowData={productItems.map((item: ProductItem) => ({ ...item, id: item._id }))}
          showDatePicker={false}
          csvColumns={csvColumns}
          exportFilename="products"
          renderRow={(row: ProductItemRow, idx: number) => (
            <>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{row.itemName}</TableCell>
              <TableCell>{row.companyName?.companyName || "All companies"}</TableCell>
              <TableCell>
                <ThemeChip label={row.status || "Active"} sx={{ background: statusColor[row.status || "Active"]?.bg, color: statusColor[row.status || "Active"]?.color, fontWeight: 600 }} />
              </TableCell>
              <TableCell>
                <IconButton
                  color="primary"
                  onClick={() => handleOpenDialog(row)}
                  disabled={loading}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => handleDelete(row._id)}
                  disabled={loading}
                >
                  <Delete />
                </IconButton>
              </TableCell>
            </>
          )}
        />

        {/* Add/Edit Dialog */}
        <CustomDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title={editId ? "Edit Product" : "New Product"}
          maxWidth="xs"
          fullWidth
        >
          <Input
            label="Product Name"
            name="itemName"
            value={form.itemName}
            onChange={handleFormChange}
            fullWidth
            required
            sx={{ mb: 2, mt: 1 }}
          />
          <Box sx={{ mb: 2 }}>
            <Select
              label="Status"
              options={STATUSES.map((s) => ({ label: s, value: s }))}
              value={form.status ? { label: form.status, value: form.status } : null}
              onChange={(_, v) => setForm((f) => ({ ...f, status: v ? String(v.value) : "Active" }))}
            />
          </Box>
          <Box sx={{ mb: 2 }}>
            {/* Two-company Phase 1 (claude/two-company-gap-analysis.md):
                optional -- left blank ("All companies"), an item stays
                visible to every company, matching every item that existed
                before this field was added. */}
            <Select
              label="Company (optional — leave blank for all companies)"
              options={companyNames.map((c: any) => ({ label: c.companyName, value: c._id }))}
              value={form.companyName ? { label: companyNames.find((c: any) => c._id === form.companyName)?.companyName || "", value: form.companyName } : null}
              onChange={(_, v) => setForm((f) => ({ ...f, companyName: v ? String(v.value) : "" }))}
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
              disabled={loading}
              sx={{ borderRadius: 2, background: '#A409F8', '&:hover': { background: '#7B06C2' } }}
            >
              Save
            </Button>
          </Box>
        </CustomDialog>
        <AddNewProductBulkDialog
          open={bulkDialogOpen}
          onClose={() => setBulkDialogOpen(false)}
          refreshData={() => dispatch(getAllProductItemsThunk({ companyName: activeCompanyId || undefined }))}
        />
      </Box>
  );
};

export default ProductsPage;