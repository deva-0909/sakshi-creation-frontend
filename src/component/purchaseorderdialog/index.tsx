"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Stack, CircularProgress, IconButton, Typography } from "@mui/material"
import { Add, Delete } from "@mui/icons-material"
import CustomDialog from "@/component/customdialog"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllMaterialsThunk } from "@/store/slices/materialSlice"
import { getAllVendorsThunk } from "@/store/slices/vendorSlice"
import { createPurchaseOrderThunk, clearPurchaseOrderError, clearPurchaseOrderSuccessMessage } from "@/store/slices/purchaseOrderSlice"
import { toast } from "react-toastify"

interface OptionType {
  label: string
  value: string
}

interface LineItem {
  materialId: OptionType | null
  quantityOrdered: string
  rate: string
}

interface AddPurchaseOrderDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
}

const emptyItem: LineItem = { materialId: null, quantityOrdered: "", rate: "" }

const AddPurchaseOrderDialog: React.FC<AddPurchaseOrderDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch()

  const { materials, loading: materialsLoading } = useAppSelector((state) => state.materials)
  const { vendors, loading: vendorsLoading } = useAppSelector((state) => state.vendors)
  const { loading: poLoading, error: poError, successMessage } = useAppSelector((state) => state.purchaseOrders)

  const [vendorId, setVendorId] = useState<OptionType | null>(null)
  const [companyName, setCompanyName] = useState<OptionType | null>(null)
  const [expectedDate, setExpectedDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      dispatch(clearPurchaseOrderError())
      dispatch(clearPurchaseOrderSuccessMessage())
      dispatch(getAllMaterialsThunk())
      dispatch(getAllVendorsThunk())
    }
  }, [open, dispatch])

  // Mobile/toggle/seed audit (2026-08-26), Phase E: this dialog has its own
  // Company field but the Vendor/Material pickers never reacted to it, so a
  // vendor or material from the other company could be picked alongside it.
  // Re-scope both lists to the dialog's own selected company, and drop the
  // vendor selection if it no longer matches (materials aren't reset since a
  // shared/unscoped material stays valid regardless of company).
  useEffect(() => {
    if (open && companyName) {
      dispatch(getAllMaterialsThunk({ companyName: companyName.value }))
      dispatch(getAllVendorsThunk({ companyName: companyName.value }))
      setVendorId(null)
    }
  }, [companyName, open, dispatch])

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearPurchaseOrderSuccessMessage())
    }
  }, [successMessage, dispatch])

  useEffect(() => {
    if (poError) {
      toast.error(poError)
      dispatch(clearPurchaseOrderError())
    }
  }, [poError, dispatch])

  const materialOptions: OptionType[] = materials.map((m: any) => ({
    label: `${m.materialName}${m.materialSize ? ` - ${m.materialSize}` : ""}${m.materialGSM ? ` (${m.materialGSM}gsm)` : ""}`,
    value: m._id,
  }))
  const vendorOptions: OptionType[] = vendors.map((v: any) => ({ label: v.name, value: v._id }))

  const resetForm = () => {
    setVendorId(null)
    setCompanyName(null)
    setExpectedDate("")
    setNotes("")
    setItems([{ ...emptyItem }])
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

  const handleSubmit = async () => {
    if (!vendorId || !companyName) {
      toast.error("Select a vendor and a company")
      return
    }
    const validItems = items.filter(
      (it) => it.materialId && Number(it.quantityOrdered) > 0 && Number(it.rate) > 0
    )
    if (validItems.length === 0) {
      toast.error("Add at least one material line item with a positive quantity and rate")
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createPurchaseOrderThunk({
          vendorId: vendorId.value,
          companyName: companyName.value,
          expectedDate: expectedDate || undefined,
          notes: notes || undefined,
          items: validItems.map((it) => ({
            materialId: it.materialId!.value,
            quantityOrdered: Number(it.quantityOrdered),
            rate: Number(it.rate),
          })),
        })
      ).unwrap()

      if (refreshData) refreshData()
      resetForm()
      onClose()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create purchase order")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="New Purchase Order">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Stack direction="row" spacing={2} mb={2}>
          <Box flex={1}>
            <ThemeSelect
              label="Vendor"
              options={vendorOptions}
              value={vendorId}
              onChange={(_, v) => setVendorId(v as OptionType | null)}
              disabled={vendorsLoading}
              required
            />
          </Box>
          <Box flex={1}>
            <CompanySelect
              name="companyName"
              value={companyName}
              onChange={(_, v) => setCompanyName(v)}
              hasParties={false}
              required
            />
          </Box>
        </Stack>

        <Typography fontWeight={600} fontSize={14} mb={1}>
          Materials
        </Typography>
        <Stack spacing={1.5} mb={2}>
          {items.map((item, index) => (
            <Stack key={index} direction="row" spacing={2} alignItems="flex-start">
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
                  labelName={index === 0 ? "Qty" : undefined}
                  type="number"
                  fullWidth
                  value={item.quantityOrdered}
                  onChange={(e) => updateItem(index, { quantityOrdered: e.target.value })}
                />
              </Box>
              <Box flex={1}>
                <ThemeInput
                  labelName={index === 0 ? "Rate" : undefined}
                  type="number"
                  fullWidth
                  value={item.rate}
                  onChange={(e) => updateItem(index, { rate: e.target.value })}
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

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="Expected Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
        </Stack>

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
          disabled={isSubmitting || poLoading}
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
          {isSubmitting || poLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Creating Purchase Order...
            </Box>
          ) : (
            "Create Purchase Order (Draft)"
          )}
        </ThemeButton>
      </Box>
    </CustomDialog>
  )
}

export default AddPurchaseOrderDialog
