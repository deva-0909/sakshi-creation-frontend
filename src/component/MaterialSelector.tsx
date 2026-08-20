"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
} from "@mui/material"
import { Add as AddIcon, Delete as DeleteIcon, Inventory as InventoryIcon } from "@mui/icons-material"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllMaterialsThunk } from "@/store/slices/materialSlice"

interface MaterialField {
  materialId: string
  materialName: string
  materialSize: string
  materialGSM: string
  numberOfSheetsUsed: string
  ratePerUnit: string
  availableStock?: number
}

interface MaterialSelectorProps {
  fields: MaterialField[]
  onChange: (fields: MaterialField[]) => void
  readOnly?: boolean
  title?: string
  showInventoryStatus?: boolean
}

interface Option {
  value: string
  label: string
}

const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  fields,
  onChange,
  readOnly = false,
  title = "Materials",
  showInventoryStatus = true,
}) => {
  const dispatch = useAppDispatch()
  const { materials } = useAppSelector((state) => state.materials)
  const [inventoryDialog, setInventoryDialog] = useState(false)
  const [selectedMaterialInventory, setSelectedMaterialInventory] = useState<any>(null)

  useEffect(() => {
    dispatch(getAllMaterialsThunk())
  }, [dispatch])

  // Get unique material names for dropdown
  const materialNameOptions: Option[] = Array.from(new Set(materials.map((material) => material.materialName))).map(
    (name) => ({
      value: name,
      label: name,
    }),
  )

  // Get GSM options based on selected material name
  const getMaterialGSMOptions = (materialName: string): Option[] => {
    const filteredMaterials = materials.filter((material) => material.materialName === materialName)
    return Array.from(new Set(filteredMaterials.map((material) => material.materialGSM.toString()))).map((gsm) => ({
      value: gsm,
      label: `${gsm} GSM`,
    }))
  }

  // Get size options based on selected material name and GSM
  const getMaterialSizeOptions = (materialName: string, materialGSM: string): Option[] => {
    const filteredMaterials = materials.filter(
      (material) => material.materialName === materialName && material.materialGSM.toString() === materialGSM,
    )
    return Array.from(new Set(filteredMaterials.map((material) => material.materialSize))).map((size) => ({
      value: size,
      label: size,
    }))
  }

  // Find material by name, GSM, and size
  const findMaterial = (materialName: string, materialGSM: string, materialSize: string) => {
    return materials.find(
      (material) =>
        material.materialName === materialName &&
        material.materialGSM.toString() === materialGSM &&
        material.materialSize === materialSize,
    )
  }

  // Get inventory status for a material
  const getInventoryStatus = (materialId: string) => {
    // This would typically come from an inventory API
    // For now, returning mock data
    const mockInventory = {
      available: Math.floor(Math.random() * 1000) + 100,
      reserved: Math.floor(Math.random() * 50),
      minimum: 50,
    }
    return mockInventory
  }

  const handleAddField = () => {
    if (readOnly) return

    const newField: MaterialField = {
      materialId: "",
      materialName: "",
      materialSize: "",
      materialGSM: "",
      numberOfSheetsUsed: "",
      ratePerUnit: "",
      availableStock: 0,
    }
    onChange([...fields, newField])
  }

  const handleDeleteField = (index: number) => {
    if (readOnly || fields.length === 1) return
    const updatedFields = fields.filter((_, i) => i !== index)
    onChange(updatedFields)
  }

  const handleFieldChange = (index: number, field: keyof MaterialField, value: string) => {
    if (readOnly) return

    const updatedFields = [...fields]
    updatedFields[index] = {
      ...updatedFields[index],
      [field]: value,
    }

    // If material name changes, reset dependent fields
    if (field === "materialName") {
      updatedFields[index].materialGSM = ""
      updatedFields[index].materialSize = ""
      updatedFields[index].materialId = ""
    }

    // If GSM changes, reset size
    if (field === "materialGSM") {
      updatedFields[index].materialSize = ""
      updatedFields[index].materialId = ""
    }

    // If size changes, find and set the material ID
    if (field === "materialSize") {
      const material = findMaterial(updatedFields[index].materialName, updatedFields[index].materialGSM, value)
      if (material) {
        updatedFields[index].materialId = material._id
        updatedFields[index].availableStock = getInventoryStatus(material._id).available
      }
    }

    onChange(updatedFields)
  }

  const handleViewInventory = (field: MaterialField) => {
    if (field.materialId) {
      const material = materials.find((m) => m._id === field.materialId)
      if (material) {
        setSelectedMaterialInventory({
          ...material,
          inventory: getInventoryStatus(field.materialId),
        })
        setInventoryDialog(true)
      }
    }
  }

  const validateField = (field: MaterialField) => {
    const errors = []
    if (!field.materialName) errors.push("Material Name is required")
    if (!field.materialGSM) errors.push("GSM is required")
    if (!field.materialSize) errors.push("Size is required")
    if (!field.numberOfSheetsUsed) errors.push("Number of sheets is required")
    if (!field.ratePerUnit) errors.push("Rate per unit is required")
    return errors
  }

  const getStockStatus = (available: number, used: number) => {
    const remaining = available - Number.parseInt(used || "0")
    if (remaining < 0) return { color: "error", text: "Insufficient Stock" }
    if (remaining < 50) return { color: "warning", text: "Low Stock" }
    return { color: "success", text: "In Stock" }
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        {!readOnly && (
          <ThemeButton
            onClick={handleAddField}
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: "#6366F1",
              color: "#fff",
              "&:hover": { backgroundColor: "#4F46E5" },
            }}
          >
            Add Material
          </ThemeButton>
        )}
      </Box>

      {fields.map((field, index) => {
        const fieldErrors = validateField(field)
        const stockStatus = field.availableStock ? getStockStatus(field.availableStock, field.numberOfSheetsUsed) : null

        return (
          <Box key={index} mb={3} p={2} border={1} borderRadius={2} borderColor="#ddd">
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography fontWeight={600}>
                Material {index + 1}
                {field.materialId && showInventoryStatus && (
                  <IconButton size="small" onClick={() => handleViewInventory(field)} sx={{ ml: 1, color: "#6366F1" }}>
                    <InventoryIcon fontSize="small" />
                  </IconButton>
                )}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {stockStatus && <Chip label={stockStatus.text} color={stockStatus.color as any} size="small" />}
                {!readOnly && fields.length > 1 && (
                  <IconButton
                    onClick={() => handleDeleteField(index)}
                    sx={{
                      color: "#F04438",
                      "&:hover": { backgroundColor: "#FEE2E2" },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            </Box>

            {fieldErrors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {fieldErrors.join(", ")}
              </Alert>
            )}

            <Stack direction="row" spacing={2} mb={2}>
              <ThemeSelect
                label="Material Name"
                options={materialNameOptions}
                value={materialNameOptions.find((opt) => opt.value === field.materialName) || null}
                onChange={(e, newValue) => handleFieldChange(index, "materialName", newValue?.value || "")}
                fullWidth
                disabled={readOnly}
              />

              <ThemeSelect
                label="GSM"
                options={getMaterialGSMOptions(field.materialName)}
                value={getMaterialGSMOptions(field.materialName).find((opt) => opt.value === field.materialGSM) || null}
                onChange={(e, newValue) => handleFieldChange(index, "materialGSM", newValue?.value || "")}
                fullWidth
                disabled={readOnly || !field.materialName}
              />

              <ThemeSelect
                label="Size"
                options={getMaterialSizeOptions(field.materialName, field.materialGSM)}
                value={
                  getMaterialSizeOptions(field.materialName, field.materialGSM).find(
                    (opt) => opt.value === field.materialSize,
                  ) || null
                }
                onChange={(e, newValue) => handleFieldChange(index, "materialSize", newValue?.value || "")}
                fullWidth
                disabled={readOnly || !field.materialGSM}
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <ThemeInput
                labelName="Number of Sheets Used"
                value={field.numberOfSheetsUsed}
                onChange={(e) => handleFieldChange(index, "numberOfSheetsUsed", e.target.value)}
                fullWidth
                type="number"
                InputProps={{ readOnly: readOnly }}
              />

              <ThemeInput
                labelName="Rate per Unit"
                value={field.ratePerUnit}
                onChange={(e) => handleFieldChange(index, "ratePerUnit", e.target.value)}
                fullWidth
                type="number"
                InputProps={{ readOnly: readOnly }}
              />

              {field.availableStock !== undefined && (
                <ThemeInput
                  labelName="Available Stock"
                  value={field.availableStock.toString()}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
              )}
            </Stack>
          </Box>
        )
      })}

      {/* Inventory Dialog */}
      <Dialog open={inventoryDialog} onClose={() => setInventoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Material Inventory Status</DialogTitle>
        <DialogContent>
          {selectedMaterialInventory && (
            <Box>
              <Typography variant="h6" mb={2}>
                {selectedMaterialInventory.materialName} - {selectedMaterialInventory.materialSize} -{" "}
                {selectedMaterialInventory.materialGSM} GSM
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Available Stock:</Typography>
                  <Typography fontWeight={600} color="success.main">
                    {selectedMaterialInventory.inventory.available} sheets
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Reserved Stock:</Typography>
                  <Typography fontWeight={600} color="warning.main">
                    {selectedMaterialInventory.inventory.reserved} sheets
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography>Minimum Level:</Typography>
                  <Typography fontWeight={600}>{selectedMaterialInventory.inventory.minimum} sheets</Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <ThemeButton onClick={() => setInventoryDialog(false)}>Close</ThemeButton>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MaterialSelector
