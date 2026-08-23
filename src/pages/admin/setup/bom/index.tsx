import React, { useEffect, useState } from "react";
import { Box, Typography, IconButton, TableCell, CircularProgress, Stack } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import BasicTable from "@/component/common_component/Table/themetable";
import ThemeInput from "@/component/common_component/themeinput";
import ThemeSelect from "@/component/common_component/themeselect";
import ThemeButton from "@/component/common_component/themebutton";
import { useAppDispatch, useAppSelector } from "@/store";
import { getAllProductItemsThunk } from "@/store/slices/productItemSlice";
import { getAllMaterialsThunk } from "@/store/slices/materialSlice";
import {
  createBomLineThunk,
  getBomForProductThunk,
  deleteBomLineThunk,
  clearBomError,
  clearBomSuccessMessage,
  clearBomLines,
} from "@/store/slices/bomSlice";
import { toast } from "react-toastify";

interface BomLineRow {
  id: string;
  _id: string;
  quantityPerUnit: number;
  unit: string;
  notes?: string;
  expectedWastagePercent?: number | null;
  material?: { _id: string; materialName: string };
}

const columns = [
  { id: "material", label: "Material" },
  { id: "quantityPerUnit", label: "Qty per unit" },
  { id: "unit", label: "Unit" },
  { id: "expectedWastagePercent", label: "Expected Wastage %" },
  { id: "notes", label: "Notes" },
  { id: "options", label: "Options" },
];

const csvColumns = [
  { id: "material", label: "Material", value: (row: BomLineRow) => row.material?.materialName || "-" },
  { id: "quantityPerUnit", label: "Qty per unit", value: (row: BomLineRow) => row.quantityPerUnit },
  { id: "unit", label: "Unit", value: (row: BomLineRow) => row.unit },
  {
    id: "expectedWastagePercent",
    label: "Expected Wastage %",
    value: (row: BomLineRow) => (row.expectedWastagePercent != null ? `${row.expectedWastagePercent}%` : "-"),
  },
  { id: "notes", label: "Notes", value: (row: BomLineRow) => row.notes || "-" },
];

const BomPage = () => {
  const dispatch = useAppDispatch();
  const { productItems } = useAppSelector((state) => state.productItems);
  const { materials } = useAppSelector((state) => state.materials);
  const { bomLines, loading, error, successMessage } = useAppSelector((state) => state.boms);

  const [selectedProduct, setSelectedProduct] = useState<{ label: string; value: string | number } | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<{ label: string; value: string | number } | null>(null);
  const [quantityPerUnit, setQuantityPerUnit] = useState("");
  const [unit, setUnit] = useState("sheet");
  const [notes, setNotes] = useState("");
  const [expectedWastagePercent, setExpectedWastagePercent] = useState("");

  useEffect(() => {
    dispatch(getAllProductItemsThunk());
    dispatch(getAllMaterialsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (selectedProduct) {
      dispatch(getBomForProductThunk(String(selectedProduct.value)));
    } else {
      dispatch(clearBomLines());
    }
  }, [selectedProduct, dispatch]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(clearBomSuccessMessage());
    }
    if (error) {
      toast.error(error);
      dispatch(clearBomError());
    }
  }, [successMessage, error, dispatch]);

  const productOptions = productItems.map((p: any) => ({ label: p.itemName, value: p._id }));
  const materialOptions = materials.map((m: any) => ({
    label: `${m.materialName}${m.materialSize ? ` - ${m.materialSize}` : ""}${m.materialGSM ? ` (${m.materialGSM}gsm)` : ""}`,
    value: m._id,
  }));

  const handleAddLine = () => {
    if (!selectedProduct) {
      toast.error("Select a product first");
      return;
    }
    if (!selectedMaterial) {
      toast.error("Select a material");
      return;
    }
    if (!quantityPerUnit || Number(quantityPerUnit) <= 0) {
      toast.error("Quantity per unit must be a positive number");
      return;
    }
    if (expectedWastagePercent && (Number(expectedWastagePercent) < 0 || Number(expectedWastagePercent) > 100)) {
      toast.error("Expected wastage % must be between 0 and 100");
      return;
    }
    dispatch(
      createBomLineThunk({
        productItem: String(selectedProduct.value),
        material: String(selectedMaterial.value),
        quantityPerUnit: Number(quantityPerUnit),
        unit,
        notes: notes || undefined,
        expectedWastagePercent: expectedWastagePercent ? Number(expectedWastagePercent) : undefined,
      })
    );
    setSelectedMaterial(null);
    setQuantityPerUnit("");
    setNotes("");
    setExpectedWastagePercent("");
  };

  const handleDelete = (id: string) => {
    dispatch(deleteBomLineThunk(id));
  };

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={600} mb={2}>
        Bill of Materials
      </Typography>
      <Typography fontSize={14} color="text.secondary" mb={3}>
        Define the materials, and how much of each, a finished unit of a product consumes. This recipe drives the
        quotation cost estimate and job card material usage.
      </Typography>

      <Box mb={3} maxWidth={420}>
        <ThemeSelect
          label="Product"
          options={productOptions}
          value={selectedProduct}
          onChange={(_, v) => setSelectedProduct(v)}
          required
          placeholder="Select a product to view/edit its recipe"
        />
      </Box>

      {selectedProduct && (
        <>
          <Stack direction="row" spacing={2} mb={2} alignItems="flex-end" flexWrap="wrap" useFlexGap>
            <Box minWidth={260}>
              <ThemeSelect
                label="Material"
                options={materialOptions}
                value={selectedMaterial}
                onChange={(_, v) => setSelectedMaterial(v)}
                required
              />
            </Box>
            <Box width={140}>
              <ThemeInput
                labelName="Qty per unit"
                type="number"
                value={quantityPerUnit}
                onChange={(e) => setQuantityPerUnit(e.target.value)}
                required
              />
            </Box>
            <Box width={120}>
              <ThemeInput labelName="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </Box>
            <Box width={160}>
              <ThemeInput
                labelName="Expected Wastage %"
                type="number"
                value={expectedWastagePercent}
                onChange={(e) => setExpectedWastagePercent(e.target.value)}
              />
            </Box>
            <Box minWidth={200} flex={1}>
              <ThemeInput labelName="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Box>
            <ThemeButton
              startIcon={<Add />}
              onClick={handleAddLine}
              disabled={loading}
              sx={{ background: "#A409F8", "&:hover": { background: "#7B06C2" }, height: 40 }}
            >
              Add Line
            </ThemeButton>
          </Stack>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <BasicTable
              tableHeader={columns}
              rowData={bomLines.map((l: any) => ({ ...l, id: l._id }))}
              showDatePicker={false}
              showSearch={false}
              showFillter={false}
              csvColumns={csvColumns}
              exportFilename="bill-of-materials"
              renderRow={(row: BomLineRow) => (
                <>
                  <TableCell>{row.material?.materialName || "-"}</TableCell>
                  <TableCell>{row.quantityPerUnit}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                  <TableCell>{row.expectedWastagePercent != null ? `${row.expectedWastagePercent}%` : "-"}</TableCell>
                  <TableCell>{row.notes || "-"}</TableCell>
                  <TableCell>
                    <IconButton color="error" onClick={() => handleDelete(row._id)} disabled={loading}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </>
              )}
            />
          )}
        </>
      )}
    </Box>
  );
};

export default BomPage;
