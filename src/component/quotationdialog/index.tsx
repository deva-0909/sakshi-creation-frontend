"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Stack, CircularProgress, FormControlLabel, Checkbox } from "@mui/material"
import CustomDialog from "@/component/customdialog"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import CompanySelect from "../reusablecomponents/CompanyWithPartyName"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllProductItemsThunk } from "@/store/slices/productItemSlice"
import { createQuotationThunk, clearQuotationError, clearQuotationSuccessMessage } from "@/store/slices/quotationSlice"
import { toast } from "react-toastify"

interface OptionType {
  label: string
  value: string
}

interface AddQuotationDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
}

const AddQuotationDialog: React.FC<AddQuotationDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch()

  const { productItems, loading: productLoading } = useAppSelector((state) => state.productItems)
  const { loading: quotationLoading, error: quotationError, successMessage } = useAppSelector((state) => state.quotations)

  const [formData, setFormData] = useState({
    companyName: "",
    partyName: "",
    itemName: "",
    qty: "",
    size: "",
    rate: "",
    printingrate: "",
    gstPercentage: "",
    validUntil: "",
    remarks: "",
  })
  const [isGst, setIsGst] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemOptions, setItemOptions] = useState<OptionType[]>([])

  useEffect(() => {
    if (open) {
      dispatch(clearQuotationError())
      dispatch(clearQuotationSuccessMessage())
      dispatch(getAllProductItemsThunk())
    }
  }, [open, dispatch])

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearQuotationSuccessMessage())
    }
  }, [successMessage, dispatch])

  useEffect(() => {
    if (quotationError) {
      toast.error(quotationError)
      dispatch(clearQuotationError())
    }
  }, [quotationError, dispatch])

  useEffect(() => {
    if (productItems && productItems.length > 0) {
      setItemOptions(productItems.map((item: any) => ({ label: item.itemName, value: item._id })))
    }
  }, [productItems])

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCompanyChange = (event: any, newValue: any) => {
    const companyId = newValue ? newValue.value : ""
    handleChange("companyName", companyId)
    handleChange("partyName", "")
    // Mobile/toggle/seed audit (2026-08-26), Phase E: re-scope the Item
    // Name picker to the chosen company (tri-state -- shared/unscoped items
    // stay visible alongside that company's own), and clear whatever item
    // was already picked since it might not match anymore.
    dispatch(getAllProductItemsThunk({ companyName: companyId || undefined }))
    handleChange("itemName", "")
  }

  const handlePartyChange = (event: any, newValue: any) => {
    handleChange("partyName", newValue ? newValue.value : "")
  }

  const getSelectedOption = (value: string, options: OptionType[]) => options.find((o) => o.value === value) || null

  const resetForm = () => {
    setFormData({
      companyName: "",
      partyName: "",
      itemName: "",
      qty: "",
      size: "",
      rate: "",
      printingrate: "",
      gstPercentage: "",
      validUntil: "",
      remarks: "",
    })
    setIsGst(true)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!formData.companyName || !formData.partyName || !formData.itemName || !formData.qty) {
      toast.error("Please fill all required fields")
      return
    }
    if (Number(formData.qty) <= 0) {
      toast.error("Quantity must be greater than 0")
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createQuotationThunk({
          companyName: formData.companyName,
          party: formData.partyName,
          productItem: formData.itemName,
          qty: Number(formData.qty),
          size: formData.size || undefined,
          rate: formData.rate ? Number(formData.rate) : undefined,
          printingrate: formData.printingrate ? Number(formData.printingrate) : undefined,
          isGst,
          gstPercentage: formData.gstPercentage ? Number(formData.gstPercentage) : undefined,
          validUntil: formData.validUntil || undefined,
          remarks: formData.remarks || undefined,
        })
      ).unwrap()

      if (refreshData) refreshData()
      resetForm()
      onClose()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create quotation")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="New Quotation">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Box mb={2}>
          <CompanySelect
            name="companyName"
            value={formData.companyName}
            onChange={handleCompanyChange}
            hasParties={true}
            required
            showPartyName={true}
            partyName={formData.partyName}
            onPartyChange={handlePartyChange}
          />
        </Box>

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeSelect
            label="Item Name"
            value={getSelectedOption(formData.itemName, itemOptions)}
            options={itemOptions}
            onChange={(_, v) => handleChange("itemName", v ? v.value : "")}
            disabled={productLoading}
            required
          />
          <ThemeInput
            labelName="Qty"
            type="number"
            fullWidth
            value={formData.qty}
            onChange={(e) => handleChange("qty", e.target.value)}
            required
          />
          <ThemeInput
            labelName="Size"
            fullWidth
            value={formData.size}
            onChange={(e) => handleChange("size", e.target.value)}
          />
        </Stack>

        <Stack direction="row" spacing={2} mb={2}>
          <ThemeInput
            labelName="Rate"
            type="number"
            fullWidth
            value={formData.rate}
            onChange={(e) => handleChange("rate", e.target.value)}
          />
          <ThemeInput
            labelName="Printing Rate"
            type="number"
            fullWidth
            value={formData.printingrate}
            onChange={(e) => handleChange("printingrate", e.target.value)}
          />
          <ThemeInput
            labelName="GST %"
            type="number"
            fullWidth
            value={formData.gstPercentage}
            onChange={(e) => handleChange("gstPercentage", e.target.value)}
            disabled={!isGst}
          />
        </Stack>

        <Stack direction="row" spacing={2} mb={2} alignItems="center">
          <FormControlLabel
            control={<Checkbox checked={isGst} onChange={(e) => setIsGst(e.target.checked)} />}
            label="GST Applicable"
          />
          <ThemeInput
            labelName="Valid Until"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={formData.validUntil}
            onChange={(e) => handleChange("validUntil", e.target.value)}
          />
        </Stack>

        <ThemeInput
          labelName="Remarks"
          fullWidth
          value={formData.remarks}
          onChange={(e) => handleChange("remarks", e.target.value)}
          sx={{ mb: 2 }}
        />

        <ThemeButton
          onClick={handleSubmit}
          disabled={isSubmitting || productLoading || quotationLoading}
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
          {isSubmitting || quotationLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Creating Quotation...
            </Box>
          ) : (
            "Create Quotation (Draft)"
          )}
        </ThemeButton>
      </Box>
    </CustomDialog>
  )
}

export default AddQuotationDialog
