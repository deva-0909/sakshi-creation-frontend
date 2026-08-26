"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Box, Stack, CircularProgress } from "@mui/material"
import CustomDialog from "@/component/customdialog"
import ThemeInput from "@/component/common_component/themeinput"
import ThemeSelect from "@/component/common_component/themeselect"
import ThemeButton from "@/component/common_component/themebutton"
import CompanySelect from "@/component/reusablecomponents/CompanyWithPartyName"
import { useAppDispatch, useAppSelector } from "@/store"
import { getAllVendorsThunk } from "@/store/slices/vendorSlice"
import { getAllPurchaseOrdersThunk } from "@/store/slices/purchaseOrderSlice"
import {
  createVendorPaymentThunk,
  clearVendorPaymentError,
  clearVendorPaymentSuccessMessage,
} from "@/store/slices/vendorPaymentSlice"
import { toast } from "react-toastify"

interface OptionType {
  label: string
  value: string
}

const MODES: OptionType[] = [
  { label: "Cash", value: "Cash" },
  { label: "Bank Transfer", value: "Bank Transfer" },
  { label: "UPI", value: "UPI" },
  { label: "Cheque", value: "Cheque" },
  { label: "Other", value: "Other" },
]

interface AddVendorPaymentDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
}

const AddVendorPaymentDialog: React.FC<AddVendorPaymentDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch()

  const { vendors, loading: vendorsLoading } = useAppSelector((state) => state.vendors)
  const { purchaseOrders, loading: poLoading } = useAppSelector((state) => state.purchaseOrders)
  const { loading: vpLoading, error: vpError, successMessage } = useAppSelector((state) => state.vendorPayments)

  const [vendorId, setVendorId] = useState<OptionType | null>(null)
  const [purchaseOrderId, setPurchaseOrderId] = useState<OptionType | null>(null)
  const [companyName, setCompanyName] = useState<OptionType | null>(null)
  const [amount, setAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState<OptionType | null>(MODES[1])
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      dispatch(clearVendorPaymentError())
      dispatch(clearVendorPaymentSuccessMessage())
      dispatch(getAllVendorsThunk())
      dispatch(getAllPurchaseOrdersThunk(undefined))
    }
  }, [open, dispatch])

  // Mobile/toggle/seed audit (2026-08-26), Phase E: re-scope the Vendor and
  // Purchase Order pickers to the dialog's own selected company, and drop
  // the vendor/PO selections if they no longer match.
  useEffect(() => {
    if (open && companyName) {
      dispatch(getAllVendorsThunk({ companyName: companyName.value }))
      dispatch(getAllPurchaseOrdersThunk({ companyName: companyName.value }))
      setVendorId(null)
      setPurchaseOrderId(null)
    }
  }, [companyName, open, dispatch])

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearVendorPaymentSuccessMessage())
    }
  }, [successMessage, dispatch])

  useEffect(() => {
    if (vpError) {
      toast.error(vpError)
      dispatch(clearVendorPaymentError())
    }
  }, [vpError, dispatch])

  const vendorOptions: OptionType[] = vendors.map((v: any) => ({ label: v.name, value: v._id }))
  const purchaseOrderOptions: OptionType[] = purchaseOrders
    .filter((po: any) => !vendorId || po.vendor?._id === vendorId.value)
    .map((po: any) => ({ label: po.poNumber, value: po._id }))

  const handleVendorChange = (_: any, v: any) => {
    setVendorId(v)
    setPurchaseOrderId(null)
  }

  const resetForm = () => {
    setVendorId(null)
    setPurchaseOrderId(null)
    setCompanyName(null)
    setAmount("")
    setPaymentDate(new Date().toISOString().slice(0, 10))
    setMode(MODES[1])
    setReferenceNumber("")
    setNotes("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    if (!vendorId || !companyName) {
      toast.error("Select a vendor and a company")
      return
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (!mode) {
      toast.error("Select a payment mode")
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createVendorPaymentThunk({
          vendorId: vendorId.value,
          purchaseOrderId: purchaseOrderId?.value,
          companyName: companyName.value,
          amount: Number(amount),
          paymentDate,
          mode: mode.value,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
        })
      ).unwrap()

      if (refreshData) refreshData()
      resetForm()
      onClose()
    } catch (error: any) {
      toast.error(error?.message || "Failed to record vendor payment")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="sm" title="New Vendor Payment">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Box flex={1}>
            <ThemeSelect
              label="Vendor"
              options={vendorOptions}
              value={vendorId}
              onChange={handleVendorChange}
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

        <Box mb={2}>
          <ThemeSelect
            label="Purchase Order (optional)"
            options={purchaseOrderOptions}
            value={purchaseOrderId}
            onChange={(_, v) => setPurchaseOrderId(v as OptionType | null)}
            disabled={poLoading}
          />
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <ThemeInput
            labelName="Amount"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <ThemeInput
            labelName="Payment Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Box flex={1}>
            <ThemeSelect
              label="Mode"
              options={MODES}
              value={mode}
              onChange={(_, v) => setMode(v as OptionType | null)}
              required
            />
          </Box>
          <Box flex={1}>
            <ThemeInput
              labelName="Reference No."
              fullWidth
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
            />
          </Box>
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
          disabled={isSubmitting || vpLoading}
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
          {isSubmitting || vpLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Recording Payment...
            </Box>
          ) : (
            "Record Payment"
          )}
        </ThemeButton>
      </Box>
    </CustomDialog>
  )
}

export default AddVendorPaymentDialog
