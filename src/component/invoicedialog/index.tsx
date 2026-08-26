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
import { getAllOrdersThunk } from "@/store/slices/orderSlice"
import { getAllQuotationsThunk } from "@/store/slices/quotationSlice"
import { createInvoiceThunk, clearInvoiceError, clearInvoiceSuccessMessage } from "@/store/slices/invoiceSlice"
import { toast } from "react-toastify"

interface OptionType {
  label: string
  value: string
}

interface LineItem {
  description: string
  hsnCode: string
  quantity: string
  unitPrice: string
  gstRate: string
}

interface AddInvoiceDialogProps {
  open: boolean
  onClose: () => void
  refreshData?: () => void
}

const emptyItem: LineItem = { description: "", hsnCode: "", quantity: "", unitPrice: "", gstRate: "" }

const AddInvoiceDialog: React.FC<AddInvoiceDialogProps> = ({ open, onClose, refreshData }) => {
  const dispatch = useAppDispatch()

  const { orders, loading: ordersLoading } = useAppSelector((state) => state.orders)
  const { quotations, loading: quotationsLoading } = useAppSelector((state) => state.quotations)
  const { loading: invoiceLoading, error: invoiceError, successMessage } = useAppSelector((state) => state.invoices)

  const [companyName, setCompanyName] = useState<OptionType | null>(null)
  const [partyName, setPartyName] = useState<OptionType | null>(null)
  const [orderId, setOrderId] = useState<OptionType | null>(null)
  const [quotationId, setQuotationId] = useState<OptionType | null>(null)
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      dispatch(clearInvoiceError())
      dispatch(clearInvoiceSuccessMessage())
      dispatch(getAllOrdersThunk(undefined))
      dispatch(getAllQuotationsThunk(undefined))
    }
  }, [open, dispatch])

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage)
      dispatch(clearInvoiceSuccessMessage())
    }
  }, [successMessage, dispatch])

  useEffect(() => {
    if (invoiceError) {
      toast.error(invoiceError)
      dispatch(clearInvoiceError())
    }
  }, [invoiceError, dispatch])

  const orderOptions: OptionType[] = orders.map((o: any) => ({ label: o.orderNumber, value: o._id }))
  const quotationOptions: OptionType[] = quotations.map((q: any) => ({ label: q.quotationNumber, value: q._id }))

  const resetForm = () => {
    setCompanyName(null)
    setPartyName(null)
    setOrderId(null)
    setQuotationId(null)
    setInvoiceDate(new Date().toISOString().slice(0, 10))
    setDueDate("")
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

  const handleCompanyChange = (event: any, newValue: any) => {
    setCompanyName(newValue)
    setPartyName(null)
    // Mobile/toggle/seed audit (2026-08-26), Phase E: the Order/Quotation
    // pickers never reacted to this dialog's own Company field, so an
    // invoice could be created linking an order/quotation from the other
    // company. Re-scope both lists and clear whatever was already picked.
    const companyId = newValue ? newValue.value : undefined
    dispatch(getAllOrdersThunk({ companyName: companyId }))
    dispatch(getAllQuotationsThunk({ companyName: companyId }))
    setOrderId(null)
    setQuotationId(null)
  }

  const handleSubmit = async () => {
    if (!companyName || !partyName) {
      toast.error("Select a company and a party")
      return
    }
    const validItems = items.filter(
      (it) => it.description.trim() && Number(it.quantity) > 0 && Number(it.unitPrice) > 0
    )
    if (validItems.length === 0) {
      toast.error("Add at least one line item with a description, quantity, and unit price")
      return
    }

    setIsSubmitting(true)
    try {
      await dispatch(
        createInvoiceThunk({
          companyName: companyName.value,
          partyId: partyName.value,
          orderId: orderId?.value,
          quotationId: quotationId?.value,
          invoiceDate,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
          items: validItems.map((it) => ({
            description: it.description,
            hsnCode: it.hsnCode || undefined,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            gstRate: Number(it.gstRate || 0),
          })),
        })
      ).unwrap()

      if (refreshData) refreshData()
      resetForm()
      onClose()
    } catch (error: any) {
      toast.error(error?.message || "Failed to create invoice")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CustomDialog open={open} onClose={handleClose} maxWidth="md" title="New Invoice">
      <Box sx={{ p: 2, background: "#fff", borderRadius: 2 }}>
        <Box mb={2}>
          <CompanySelect
            name="companyName"
            value={companyName}
            onChange={handleCompanyChange}
            hasParties={true}
            required
            showPartyName={true}
            partyName={partyName || ""}
            onPartyChange={(_, v) => setPartyName(v)}
          />
        </Box>
        <Typography fontSize={12} color="text.secondary" mb={2} mt={-1.5}>
          CGST/SGST vs IGST is determined automatically from the company's and party's State — set those under Setup if this fails.
        </Typography>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <Box flex={1}>
            <ThemeSelect
              label="Order (optional)"
              options={orderOptions}
              value={orderId}
              onChange={(_, v) => setOrderId(v as OptionType | null)}
              disabled={ordersLoading}
            />
          </Box>
          <Box flex={1}>
            <ThemeSelect
              label="Quotation (optional)"
              options={quotationOptions}
              value={quotationId}
              onChange={(_, v) => setQuotationId(v as OptionType | null)}
              disabled={quotationsLoading}
            />
          </Box>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} mb={2}>
          <ThemeInput
            labelName="Invoice Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            required
          />
          <ThemeInput
            labelName="Due Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </Stack>

        <Typography fontWeight={600} fontSize={14} mb={1}>
          Line Items
        </Typography>
        <Stack spacing={1.5} mb={2}>
          {items.map((item, index) => (
            <Stack key={index} direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-start">
              <Box flex={2}>
                <ThemeInput
                  labelName={index === 0 ? "Description" : undefined}
                  fullWidth
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                />
              </Box>
              <Box flex={1}>
                <ThemeInput
                  labelName={index === 0 ? "HSN" : undefined}
                  fullWidth
                  value={item.hsnCode}
                  onChange={(e) => updateItem(index, { hsnCode: e.target.value })}
                />
              </Box>
              <Box flex={1}>
                <ThemeInput
                  labelName={index === 0 ? "Qty" : undefined}
                  type="number"
                  fullWidth
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                />
              </Box>
              <Box flex={1}>
                <ThemeInput
                  labelName={index === 0 ? "Unit Price" : undefined}
                  type="number"
                  fullWidth
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                />
              </Box>
              <Box flex={1}>
                <ThemeInput
                  labelName={index === 0 ? "GST %" : undefined}
                  type="number"
                  fullWidth
                  value={item.gstRate}
                  onChange={(e) => updateItem(index, { gstRate: e.target.value })}
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
          disabled={isSubmitting || invoiceLoading}
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
          {isSubmitting || invoiceLoading ? (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} color="inherit" />
              Creating Invoice...
            </Box>
          ) : (
            "Create Invoice (Draft)"
          )}
        </ThemeButton>
      </Box>
    </CustomDialog>
  )
}

export default AddInvoiceDialog
