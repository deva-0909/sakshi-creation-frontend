"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Stack, CircularProgress, Checkbox, FormControlLabel, IconButton, Typography, Divider } from "@mui/material"
import { Add, Delete } from "@mui/icons-material"
import CustomDialog from "@/component/customdialog"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllMaterialsThunk } from "@/store/slices/materialSlice"
import { getAllVendorsThunk } from "@/store/slices/vendorSlice"
import { createRfqThunk, clearRfqError, clearRfqSuccessMessage } from "@/store/slices/rfqSlice"
import { toast } from "react-toastify"

interface OptionType {
  label: string
  value: string
}

interface LineItem {
  materialId: OptionType | null
  quantityNeeded: string
}

interface AddRfqDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
}

const emptyItem: LineItem = { materialId: null, quantityNeeded: "" }

const AddRfqDialog: React.FC<AddRfqDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch()

  const { materials, loading: materialsLoading } = useAppSelector((state) => state.materials)
  const { vendors, loading: vendorsLoading } = useAppSelector((state) => state.vendors)
  const { loading: rfqLoading, error: rfqError, successMessage } = useAppSelector((state) => state.rfqs)

  const [companyName, setCompanyName] = useState<OptionType | null>(null)
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }])
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      dispatch(clearRfqError())
      dispatch(clearRfqSuccessMessage())
      dispatch(getAllMaterialsThunk())
      dispatch(getAllVendorsThunk())
    }
  }, [open, dispatch])

  // Mobile/toggle/seed audit (2026-08-26), Phase E: re-scope the Material
  // picker and the "Invite Vendors" checklist to the dialog's own selected
  // company, and drop any already-checked vendors that no longer match.
  useEffect(() => {
    if (open && companyName) {
      dispatch(getAllMaterialsThunk({ companyName: companyName.value }))
      dispatch(getAllVendorsThunk({ companyName: companyName.value }))
      setSelectedVendorIds([])
    }
  }, [companyName, open, dispatch])

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearRfqSuccessMessage())
    }
  }, [successMessage, dispatch])

  useEffect(() => {
    if (rfqError) {
      toast.error(rfqError)
      dispatch(clearRfqError())
    }
  }, [rfqError, dispatch])

  const materialOptions: OptionType[] = materials.map((m: any) => ({
    label: `${m.materialName}${m.materialSize ? ` - ${m.materialSize}` : ""}${m.materialGSM ? ` (${m.materialGSM}gsm)` : ""}`,
    value: m._id,
  }))

  const resetForm = () => {
    setCompanyName(null)
    setNotes("")
    setItems([{ ...emptyItem }])
    setSelectedVendorIds([])
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const updateItem = (index: number, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const addItemRow = () => setItems((prev) => [...prev, { ...emptyItem }])
  const removeItemRow = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index))

  const toggleVendor = (id: string) => {
    setSelectedVendorIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const handleSubmit = async () => {
    if (!companyName) {
      toast.error("Select a company")
      return
    }
    const validItems = items.filter((it) => it.materialId && Number(it.quantityNeeded) > 0)
    if (validItems.length === 0) {
      toast.error("Add at least one material line item with a positive quantity")
      return
    }
    if (selectedVendorIds.length === 0) {
      toast.error("Invite at least one vendor")
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createRfqThunk({
          companyName: companyName.value,
          notes: notes || undefined,
          items: validItems.map((it) => ({
            materialId: it.materialId!.value,
            quantityNeeded: Number(it.quantityNeeded),
          })),
          vendorIds: selectedVendorIds,
        })
      ).unwrap()

      if (refreshData) refreshData()
      resetForm()
      onClose()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create RFQ")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="New RFQ">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Box mb={2}>
          <CompanySelect
            name="companyName"
            value={companyName}
            onChange={(_, v) => setCompanyName(v)}
            hasParties={false}
            required
          />
        </Box>

        <Typography fontWeight={600} fontSize={14} mb={1}>
          Materials Needed
        </Typography>
        <Stack spacing={1.5} mb={2}>
          {items.map((item, index) => (
            <Stack key={index} direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
              <Box flex={2}>
                <ThemeSelect
                  label={index === 0 ? "Material" : undefined}
                  options={materialOptions}
                  value={item.materialId}
                  onChange={(_, v) => updateItem(index, { materialId: v as OptionType | null })}
                  disabled={materialsLoading}
                />
              </Box>
              <Box flex={1}>
                <ThemeInput
                  labelName={index === 0 ? "Qty Needed" : undefined}
                  type="number"
                  fullWidth
                  value={item.quantityNeeded}
                  onChange={(e) => updateItem(index, { quantityNeeded: e.target.value })}
                />
              </Box>
              <IconButton
                onClick={() => removeItemRow(index)}
                disabled={items.length === 1}
                sx={{ mt: index === 0 ? 3.5 : 0 }}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Stack>
          ))}
          <ThemeButton
            variant="outlined"
            startIcon={<Add />}
            onClick={addItemRow}
            sx={{ alignSelf: "flex-start" }}
          >
            Add Line
          </ThemeButton>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography fontWeight={600} fontSize={14} mb={1}>
          Invite Vendors
        </Typography>
        {vendorsLoading ? (
          <CircularProgress size={20} />
        ) : (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
            {vendors.map((v: any) => (
              <FormControlLabel
                key={v._id}
                control={
                  <Checkbox
                    checked={selectedVendorIds.includes(v._id)}
                    onChange={() => toggleVendor(v._id)}
                  />
                }
                label={v.name}
                sx={{ border: "1px solid #EAECF0", borderRadius: 2, mr: 1, pr: 1 }}
              />
            ))}
            {vendors.length === 0 && (
              <Typography fontSize={13} color="text.secondary">
                No vendors set up yet.
              </Typography>
            )}
          </Box>
        )}

        <ThemeInput
          labelName="Notes"
          fullWidth
          multiline
          minRows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 2 }}
        />

        <ThemeButton
          onClick={handleSubmit}
          disabled={isSubmitting || rfqLoading}
          sx={{
            background: "#12B76A",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            width: "100%",
            mt: 1,
            "&:hover": { background: "#079455" },
          }}
        >
          {isSubmitting || rfqLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Creating RFQ...
            </Box>
          ) : (
            "Create RFQ (Draft)"
          )}
        </ThemeButton>
      </Box>
    </CustomDialog>
  )
}

export default AddRfqDialog
